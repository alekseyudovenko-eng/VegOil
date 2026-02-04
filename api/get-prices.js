export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - 1);
  const start = new Date(today);
  start.setDate(today.getDate() - 8);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  try {
    // 1. ПОЛУЧАЕМ ДАННЫЕ ДЛЯ ГРАФИКА (MPOC)
    const chartRes = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        urls: ["https://mpoc.org.my/market-insight/daily-palm-oil-prices/"],
      })
    });
    const chartExtraction = await chartRes.json();
    const chartRaw = chartExtraction.results?.[0]?.raw_content || "";

    // Превращаем текст в JSON для графика
    const groqChart = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ 
          role: "system", 
          content: "Extract daily prices for Feb 2026. Return ONLY a JSON array: [{\"date\": \"Feb 01\", \"price\": 4225}]. No text, only JSON." 
        }, { 
          role: "user", 
          content: chartRaw 
        }],
        temperature: 0
      })
    });
    const chartJsonRes = await groqChart.json();
    const chartDataJSON = JSON.parse(chartJsonRes.choices[0].message.content || "[]");

    // 2. ИЩЕМ НОВОСТИ
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `latest market prices news Feb 2026 palm oil Sunflower Rapeseed Soybean Cottonseed crude oil`,
        search_depth: "advanced",
        max_results: 8,
        days: 7
      })
    });
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n\n") || "No news found.";

    // 3. ГЕНЕРИРУЕМ ТЕКСТ ОТЧЕТА
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a Senior Analyst. Create a report for Feb 2026. Use ## headers. Ignore 2025." },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });
    const gReportData = await groqReport.json();

    // ОТПРАВЛЯЕМ ВСЁ ВМЕСТЕ
    res.status(200).json({ 
      report: gReportData.choices[0].message.content,
      chartData: chartDataJSON 
    });

  } catch (e) {
    res.status(200).json({ 
      report: `## Error\n${e.message}`, 
      chartData: [] 
    });
  }
}
