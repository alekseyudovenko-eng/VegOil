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
  const dateString = fourteenDaysAgo.toISOString().split('T')[0];

  // 2. MULTILINGUAL SEARCH CONFIGS
  const configs = {
    news: {
      query: `(vegetable oils OR specialty fats OR margarine OR "oil market") (Russia OR Uzbekistan OR Kazakhstan OR Europe OR India) after:${dateString}`,
      system: "You are a Global Analyst. Create a report based on provided English and Russian sources. Focus on market trends, logistics, and production."
    },
    prices: {
      query: `(price OR FOB OR quotes) (sunflower oil OR palm oil OR rapeseed OR "specialty fats") after:${dateString}`,
      system: "You are a Price Analyst. Extract all price data and quotes. Create clear Markdown tables."
    },
    policy: {
      query: `(export duty OR import tax OR regulations) (oil OR fats) (Russia OR EU OR Uzbekistan OR Kazakhstan) after:${dateString}`,
      system: "You are a Trade Policy Expert. Summarize regulatory changes."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 3. SEARCH VIA SERPER
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: current.query,
        num: 30
      })
    });

    const searchData = await serperRes.json();

    // 4. PARSE SNIPPETS
    const snippets = [
      ...(searchData.organic || []).map(res => `${res.title}: ${res.snippet}`),
      ...(searchData.news || []).map(res => `${res.title}: ${res.snippet}`),
      ...(searchData.answerBox ? [JSON.stringify(searchData.answerBox)] : [])
    ].join("\n\n");

    if (!snippets || snippets.length < 100) {
      return res.status(200).json({ report: `### No significant data found for the query since ${dateString}.` });
    }

    // 5. GENERATE REPORT VIA GROQ
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
            3. Mandatory: Detailed breakdown for Margarines, Specialty Fats (CBE, CBS, CBR), and Shortenings.
            4. Formatting: Use Markdown headers and tables for prices.
            5. Content: Analytical, data-driven, no fluff.` 
          },
          { role: "user", content: `Search results (14-day window): \n${snippets}` }
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
