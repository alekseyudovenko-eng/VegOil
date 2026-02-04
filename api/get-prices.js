export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // 2026-02-04

  try {
    // 1. ИЗВЛЕКАЕМ ТАБЛИЦУ С MPOC
    const mpocRes = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        urls: ["https://mpoc.org.my/market-insight/daily-palm-oil-prices/"],
      })
    });
    const extraction = await mpocRes.json();
    const rawContent = extraction.results?.[0]?.raw_content || "";

    // 2. ГИБРИДНЫЙ ПАРСИНГ (ИИ только извлекает, код фильтрует)
    const groqChart = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ 
          role: "system", 
          content: `Extract daily prices for late Jan/Feb 2026. 
          Return ONLY a JSON array: [{"date": "2026-02-03", "price": 4225}]. 
          Use YYYY-MM-DD format. No future dates. No prose.` 
        }, { 
          role: "user", content: rawContent 
        }],
        temperature: 0
      })
    });

    const chartJsonRes = await groqChart.json();
    let chartData = JSON.parse(chartJsonRes.choices[0].message.content || "[]");

    // ЖЕСТКИЙ ФИЛЬТР: Удаляем всё, что позже сегодняшнего дня
    chartData = chartData
      .filter(item => item.date <= todayStr) 
      .map(item => ({
        date: item.date.split('-').slice(2).join('/') + '.' + item.date.split('-')[1], // "03.02"
        price: item.price
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Сортируем по дате

    // 3. НОВОСТИ (Тут всё как раньше)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `latest FCPO palm oil prices news Feb 2026`,
        search_depth: "advanced", max_results: 6, days: 3
      })
    });
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n\n");

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Senior Analyst. Feb 2026 only. No 2025 data. ## headers." },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });
    const gReport = await groqReport.json();

    res.status(200).json({ 
      report: gReport.choices[0].message.content,
      chartData: chartData 
    });

  } catch (e) {
    res.status(200).json({ report: `## Error\n${e.message}`, chartData: [] });
  }
}
