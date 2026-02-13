export default async function handler(req, res) {
  const { category } = req.query;
  const SERPER_KEY = process.env.SERPER_API_KEY || process.env.VITE_SERPER_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!SERPER_KEY || !GROQ_KEY) {
    return res.status(200).json({ report: "### Config Error: API keys missing." });
  }

  // 1. Динамические даты
  const today = new Date();
  const formattedToday = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentMonthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const dateString = fourteenDaysAgo.toISOString().split('T')[0];

  // 2. Конфиги с динамическим поиском (currentMonthYear подставит актуальный месяц)
  const configs = {
    news: {
      query: `vegetable oils fats market logistics finance news Russia Ukraine Europe Uzbekistan Kazakhstan Caucasus Global ${currentMonthYear}`,
      system: `You are a Strict Market Intelligence Bot. 
      CRITICAL INSTRUCTIONS:
      1. DO NOT use phrases like "No recent updates", "Stable situation", or "Remains a concern". 
      2. If you find NO news for a section, provide the LATEST PRICE from snippets instead.
      3. MANDATORY: Report the Russian export duty increase to 9,495 RUB/t (if effective Feb 2026).
      4. MANDATORY: Report key outcomes from the Kazakh Grain & Logistic Forum (Almaty, Feb 3-4, 2026) regarding Middle Corridor.
      5. LOGISTICS: Focus on freight rates, port congestion, and specific rail routes (BTK, Middle Corridor).
      6. SPECIALTY FATS: Report only specific price/demand changes for CBE, CBS, or Margarine.
      7. FORMAT: Use bold text for numbers and dates. Professional English only.`
    },
    prices: {
      query: `sunflower palm rapeseed oil price quotes ${currentMonthYear} market analysis`,
      system: "You are a Price Analyst. Extract specific price data and format into Markdown tables."
    },
    policy: {
      query: `export import duties regulations vegetable oils fats Russia EU Uzbekistan Kazakhstan ${currentMonthYear}`,
      system: "You are a Regulatory Expert. List changes in duties and laws from the last 14 days."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 3. Поиск (Serper)
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: current.query, num: 100, tbs: "qdr:w2" })
    });

    const searchData = await serperRes.json();
    const snippets = [
      ...(searchData.organic || []).map(res => `${res.title}: ${res.snippet}`),
      ...(searchData.news || []).map(res => `${res.title}: ${res.snippet}`)
    ].join("\n\n");

    if (!snippets || snippets.length < 100) {
      return res.status(200).json({ report: `### No significant news found since ${dateString}.` });
    }

    // 4. Анализ (Groq) — БЛОК ОДИН, БЕЗ ДУБЛЕЙ
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `${current.system} 
            IMPORTANT: Today is ${formattedToday}. 
            Focus ONLY on news and data from the last 14 days. 
            Current year is ${today.getFullYear()}.` 
          },
          { role: "user", content: `Search results: \n${snippets}` }
        ],
        temperature: 0.1
      })
    });

    const aiData = await groqRes.json();
    
    if (aiData.error) {
       throw new Error(aiData.error.message);
    }

    res.status(200).json({ report: aiData.choices[0].message.content });

  } catch (error) {
    console.error("Handler Error:", error);
    res.status(200).json({ report: `### System Error: ${error.message}` });
  }
}
