export default async function handler(req, res) {
  const { type } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  try {
    // 1. ПОИСК (делается один раз для контекста)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Crude Palm Oil FCPO prices and vegetable oil market news Feb 2026",
        search_depth: "advanced",
        days: 7
      })
    });
    const sData = await searchRes.json();
    const context = sData.results.map(r => r.content).join("\n\n");

    // 2. ОБРАБОТКА (разные промпты для разных задач)
    let prompt = "";
    if (type === 'chart') {
      prompt = `EXTRACT NUMERIC DATA ONLY from context: ${context}. Return JSON: {"data": [{"date": "YYYY-MM-DD", "open": 0, "high": 0, "low": 0, "close": 0}]}. DO NOT INVENT DATA.`;
    } else {
      prompt = `Create a market report from context: ${context}. Return JSON with keys: "summary", "topNews", "policyUpdates", "priceTrends", "tradeTable".`;
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const gData = await groqRes.json();
    const content = JSON.parse(gData.choices[0].message.content);

    // Важно: возвращаем только то, что нужно конкретному вызову
    if (type === 'chart') {
      return res.status(200).json(content.data ? content : { data: [] });
    } else {
      return res.status(200).json({ report: content.report || content, sources: sData.results });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
