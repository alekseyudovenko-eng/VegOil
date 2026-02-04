export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // 1. ПОИСК АКТУАЛЬНЫХ ЦЕН
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Crude Palm Oil price MYR/T, Soybean Oil price CBOT, Sunflower Oil price Black Sea FOB, Rapeseed Oil price Matif - February 4 2026`,
        search_depth: "advanced",
        max_results: 8
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n\n") || "No price data found.";

    // 2. ГЕНЕРАЦИЯ ОТЧЕТА С ТАБЛИЦЕЙ
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Terminal Intelligence. Today is Feb 4, 2026. 
            Create a market report.
            START with a "## CURRENT MARKET PRICES" section. 
            Inside it, create a Markdown table with columns: Commodity, Price, Change, Unit.
            Then add sections: ## MARKET ANALYSIS and ## KEY DRIVERS using the provided context.
            Use professional, cold, terminal-style tone.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });

    const gReport = await groqReport.json();
    const reportText = gReport.choices?.[0]?.message?.content || "## Error\nUnable to reach intelligence core.";

    res.status(200).json({ 
      report: reportText,
      chartData: [] // Оставляем пустым, чтобы интерфейс показал заглушку
    });

  } catch (e) {
    res.status(200).json({ report: `## Connection Error\n${e.message}`, chartData: [] });
  }
}
