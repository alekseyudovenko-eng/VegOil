export default async function handler(req, res) {
  const { category } = req.query;
  const SERPER_KEY = process.env.SERPER_API_KEY || process.env.VITE_SERPER_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!SERPER_KEY || !GROQ_KEY) {
    return res.status(200).json({ report: "### Config Error: API keys missing." });
  }

  // 1. DATE SETUP (Last 14 days)
  const today = new Date();
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const dateFilter = `after:${fourteenDaysAgo.toISOString().split('T')[0]}`;

  // 2. ENGLISH SEARCH CONFIGS
  const configs = {
    news: {
      query: `vegetable oils fats market report margarine specialty fats shortening news logistics Europe CIS Central Asia Caucasus Russia Ukraine ${dateFilter}`,
      system: "You are a Senior Market Analyst. Provide a professional market review for the last 14 days. Cover oils, margarines, specialty fats (CBE, CBS, CBR), and shortenings. Focus on Europe, CIS, Central Asia, and Caucasus."
    },
    prices: {
      query: `sunflower oil price FOB, BMD Palm Oil, MATIF rapeseed, margarine shortening market prices Europe Asia ${dateFilter}`,
      system: "You are a Financial Analyst. Collect price quotes and market rates from the last 14 days. Focus on oils and processed fats. Output data in Markdown tables."
    },
    policy: {
      query: `vegetable oil import export duties taxes regulations Russia EU India Uzbekistan Kazakhstan ${dateFilter}`,
      system: "You are a Trade Policy Expert. Summarize changes in duties, quotas, and trade regulations for the oil and fat industry in the specified regions."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 3. SEARCH (Global English Focus)
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: current.query,
        num: 25,
        tbs: "qdr:w2" // Filter for last 2 weeks
      })
    });

    const searchData = await serperRes.json();
    const snippets = [
      ...(searchData.organic || []).map(res => `${res.title}: ${res.snippet}`),
      ...(searchData.news || []).map(res => `${res.title}: ${res.snippet}`)
    ].join("\n\n");

    if (!snippets || snippets.length < 100) {
      return res.status(200).json({ report: `### No significant English-language data found for the last 14 days.` });
    }

    // 4. GENERATE ENGLISH REPORT
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `${current.system} 
            INSTRUCTIONS:
            1. Language: Professional English.
            2. Period: Last 14 days.
            3. Mandatory: Detailed breakdown for Margarines, Specialty Fats (CBE, CBS), and Shortenings.
            4. Formatting: Use Markdown headers and tables for prices.
            5. Content: Analytical, data-driven, no fluff.` 
          },
          { role: "user", content: `Search results (14-day window): \n${snippets}` }
        ],
        temperature: 0.1
      })
    });

    const aiData = await groqRes.json();
    res.status(200).json({ report: aiData.choices[0].message.content });

  } catch (error) {
    res.status(200).json({ report: `### System Error: ${error.message}` });
  }
}
