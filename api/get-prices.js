export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // 1. БЫСТРЫЙ ПОИСК (BASIC + 10 результатов)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Price Feb 2026: Palm Oil MYR FCPO, Soybean Oil CBOT, Sunflower Oil FOB, Rapeseed Oil, Brent Crude news sources`,
        search_depth: "basic", 
        max_results: 10,
        days: 7 
      })
    });
    
    const sData = await searchRes.json();
    
    // Формируем сжатый контекст, чтобы Groq не тратил время на чтение тонн текста
    const context = sData.results?.map(r => `[${r.url}] ${r.content}`).join("\n") || "No data";

    // 2. ГЕНЕРАЦИЯ ОТЧЕТА (с лимитом токенов для скорости)
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Terminal Intelligence. 
            - Quotes: [SYMBOL] NAME: PRICE | BASIS | DATE | SOURCE
            - News: [DATE] TOPIC (Source: domain.com)
            - STYLE: Cold, brief, monochromatic.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        max_tokens: 1000, // Ограничение, чтобы ускорить ответ
        temperature: 0.1
      })
    });

    const gData = await groqReport.json();
    const result = gData.choices?.[0]?.message?.content || "## Status\nData empty.";

    res.status(200).json({ report: result, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## SYSTEM_ERROR\n${e.message}`, chartData: [] });
  }
}
