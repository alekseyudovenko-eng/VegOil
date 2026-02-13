export default async function handler(req, res) {
  const { category } = req.query;
  const SERPER_KEY = process.env.SERPER_API_KEY || process.env.VITE_SERPER_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!SERPER_KEY || !GROQ_KEY) {
    return res.status(200).json({ report: "### Config Error: API keys missing." });
  }

  const today = new Date();
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const dateString = fourteenDaysAgo.toISOString().split('T')[0];

  const configs = {
    news: {
      query: `vegetable oils fats market logistics finance news Russia Ukraine Europe Uzbekistan Kazakhstan Caucasus Global trends February 2026`,
      system: `You are a Senior Strategic Analyst. Provide a RECENT NEWS DIGEST (last 14 days) structured by regions.
      1. RUSSIA & CIS (Focus on export quotas, domestic prices, logistics in Azov/Black Sea).
      2. CENTRAL ASIA & CAUCASUS (Uzbekistan, Kazakhstan, Georgia, Azerbaijan: import trends, local production, regional logistics).
      3. EUROPE (MATIF prices, EU policy, port situation, logistics).
      4. GLOBAL CONTEXT (Global benchmarks: Palm Oil, Soy, Crude oil impact).
      REQUIREMENTS: Mention specific facts on logistics, finance, and specialty fats (CBE, CBS). Use bullet points.`
    },
    prices: {
      query: `sunflower palm rapeseed oil price quotes February 2026 market analysis`,
      system: "You are a Price Analyst. Extract specific price data and format into Markdown tables."
    },
    policy: {
      query: `export import duties regulations vegetable oils fats Russia EU Uzbekistan February 2026`,
      system: "You are a Regulatory Expert. List changes in duties and laws from the last 14 days."
    }
  };

  const current = configs[category] || configs.news;

  try {
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: current.query, num: 40, tbs: "qdr:w2" })
    });

    const searchData = await serperRes.json();
    const snippets = [
      ...(searchData.organic || []).map(res => `${res.title}: ${res.snippet}`),
      ...(searchData.news || []).map(res => `${res.title}: ${res.snippet}`)
    ].join("\n\n");

    if (!snippets || snippets.length < 100) {
      return res.status(200).json({ report: `### No significant news found since ${dateString}.` });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `${current.system} Language: Professional English. Period: Last 14 days.` },
          { role: "user", content: `Search results: \n${snippets}` }
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
