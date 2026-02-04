export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  try {
    // 1. ПОПЫТКА ИЗВЛЕЧЬ ЦЕНЫ
    let chartData = [];
    try {
      const mpocRes = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_KEY,
          urls: ["https://mpoc.org.my/market-insight/daily-palm-oil-prices/"],
        })
      });
      const extraction = await mpocRes.json();
      
      // Проверка: есть ли результаты извлечения?
      if (extraction.results && extraction.results.length > 0) {
        const rawContent = extraction.results[0].raw_content;

        const groqChart = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ 
              role: "system", 
              content: `Extract daily prices for Feb 2026. Return ONLY a JSON array: [{"date": "2026-02-03", "price": 4225}]. No prose.` 
            }, { 
              role: "user", content: rawContent 
            }],
            temperature: 0
          })
        });

        const chartJsonRes = await groqChart.json();
        if (chartJsonRes.choices?.[0]?.message?.content) {
          let parsed = JSON.parse(chartJsonRes.choices[0].message.content);
          chartData = parsed
            .filter(item => item.date <= todayStr)
            .map(item => ({
              date: item.date.split('-').reverse().slice(0, 2).join('.'), // "03.02"
              price: item.price
            }));
        }
      }
    } catch (chartErr) {
      console.error("Chart error:", chartErr);
    }

    // 2. НОВОСТИ
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
    const context = sData.results?.map(r => r.content).join("\n\n") || "No news found.";

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Senior Analyst. Feb 2026 only. Use ## headers." },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });
    
    const gReport = await groqReport.json();
    const reportText = gReport.choices?.[0]?.message?.content || "## Status\nReport generation failed.";

    res.status(200).json({ 
      report: reportText,
      chartData: chartData 
    });

  } catch (e) {
    res.status(200).json({ report: `## Technical Error\n${e.message}`, chartData: [] });
  }
}
