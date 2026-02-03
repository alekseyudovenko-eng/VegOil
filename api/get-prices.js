export default async function handler(req, res) {
  const { type, timeframe = '1M' } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  try {
    // 1. ПОЛУЧАЕМ ДАННЫЕ (Через Tavily Search для актуальности)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `FCPO palm oil prices historical data and vegetable oil market news Jan 2026`,
        search_depth: "advanced",
        include_answer: true
      })
    });
    const searchData = await searchRes.json();
    const context = (searchData.results || []).map(r => r.content).join("\n");
    const sources = (searchData.results || []).map(r => ({ title: r.title, uri: r.url }));

    // 2. ОБРАБАТЫВАЕМ ЗАПРОС ЧЕРЕЗ GROQ (Llama 3.3 70B работает как Gemini)
    if (type === 'chart') {
      const groqChartRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "system",
            content: "Generate JSON: { \"prices\": [{ \"date\": \"ISO_DATE\", \"open\": num, \"high\": num, \"low\": num, \"close\": num }] } for FCPO based on context."
          }, {
            role: "user",
            content: `Create 30 daily price points for FCPO ending Feb 3, 2026. Trend based on: ${context}`
          }],
          response_format: { type: "json_object" }
        })
      });
      const chartJson = await groqChartRes.json();
      const parsed = JSON.parse(chartJson.choices[0].message.content);
      return res.status(200).json({ data: parsed.prices, sources: sources.slice(0, 3), isFallback: false });
    }

    if (type === 'report') {
      const groqReportRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "system",
            content: "You are a market analyst. Return ONLY JSON matching the provided schema."
          }, {
            role: "user",
            content: `Context: ${context}. Generate a report for Feb 3, 2026. Use schema: { "summary": "", "topNews": [{commodity, headline, content}], "priceTrends": [{commodity, trend, details}], "regionalHighlights": [{region, events}], "tradeTable": [{country, commodity, volume, volumeType, status}], "policyUpdates": [{country, update}] }`
          }],
          response_format: { type: "json_object" }
        })
      });
      const reportJson = await groqReportRes.json();
      const report = JSON.parse(reportJson.choices[0].message.content);
      return res.status(200).json({ report, sources: sources.slice(0, 6), isFallback: false });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
