export default async function handler(req, res) {
  const { timeframe = '1M' } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `FCPO palm oil prices Feb 2026 market news sunflower oil trade flows Russia CIS`,
        search_depth: "advanced",
        max_results: 6
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results.map(r => r.content).join("\n\n");
    const sources = sData.results.map(r => ({ title: r.title, uri: r.url }));

    const systemRole = `You are a financial analyst. Use the provided context to create a REAL market report. 
    Today is ${today}. Return ONLY a JSON object.`;

    const userPrompt = `
    CONTEXT: ${context}

    Extract data and format it EXACTLY like this JSON:
    {
      "report": {
        "summary": "Full overview of current trends...",
        "topNews": [
          { "commodity": "Palm Oil", "headline": "...", "content": "..." }
        ],
        "policyUpdates": [
          { "country": "Russia", "update": "..." }
        ],
        "priceTrends": [
          { "commodity": "Palm Oil", "trend": "up", "details": "..." },
          { "commodity": "Sunflower Oil", "trend": "down", "details": "..." }
        ],
        "tradeTable": [
          { "country": "Kazakhstan", "commodity": "Sunflower Oil", "volumeType": "Export", "volume": "50,000 MT", "status": "Active" }
        ]
      },
      "data": [
        { "date": "${today}", "open": 4100, "high": 4150, "low": 4080, "close": 4120 }
      ]
    }
    
    RULES:
    1. "trend" MUST be only 'up', 'down', or 'stable'.
    2. Fill "data" with at least 15 real/calculated price points based on context.
    3. Ensure all keys in "report" exist to avoid frontend errors.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemRole }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const gData = await groqRes.json();
    const result = JSON.parse(gData.choices[0].message.content);

    // Гарантируем, что report существует
    return res.status(200).json({
      report: result.report,
      data: result.data || [],
      sources: sources
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
