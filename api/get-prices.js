export default async function handler(req, res) {
  const { type, timeframe } = req.query; // Получаем тот самый 'type'
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  try {
    // ОБЩИЙ ПОИСК (для обоих типов нужен контекст)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `FCPO palm oil prices news ${type === 'chart' ? 'historical data' : 'market analysis'} Feb 2026`,
        search_depth: "advanced",
        days: 7
      })
    });
    const sData = await searchRes.json();
    const context = sData.results.map(r => r.content).join("\n\n");

    // РАЗДЕЛЕНИЕ ЛОГИКИ
    if (type === 'chart') {
      // ИИ генерирует только цифры для графика
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `Extract ONLY price history from: ${context}. Return JSON: {"data": [...]}` }],
          response_format: { type: "json_object" }
        })
      });
      const gData = await groqRes.json();
      return res.status(200).json(JSON.parse(gData.choices[0].message.content));
    } 
    
    if (type === 'report') {
      // ИИ генерирует только текст отчета
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `Create a market report from: ${context}. Return JSON: {"report": {...}}` }],
          response_format: { type: "json_object" }
        })
      });
      const gData = await groqRes.json();
      const result = JSON.parse(gData.choices[0].message.content);
      return res.status(200).json({ report: result.report, sources: sData.results });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
