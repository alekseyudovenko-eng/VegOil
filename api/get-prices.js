export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Current prices Feb 4 2026: Palm Oil FCPO MYR, Soybean Oil CBOT, Sunflower Oil FOB, Rapeseed Oil MATIF, Brent Crude`,
        search_depth: "basic",
        max_results: 5 // Минимум результатов для экономии лимитов
      })
    });
    
    const sData = await searchRes.json();
    
    // ЭКСТРЕМАЛЬНОЕ СЖАТИЕ: берем только по 300 символов от каждого результата
    const context = sData.results?.map(r => 
      `[Source: ${new URL(r.url).hostname}] ${r.content.substring(0, 300)}`
    ).join("\n") || "No context";

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: "Terminal AI. Task: Extract prices & 3 news bullets. Format: [SYMBOL] NAME: PRICE | BASIS | DATE | SOURCE. Style: Cold English." 
          },
          { role: "user", content: `Data: ${context}` }
        ],
        temperature: 0,
        max_tokens: 500 // Короткий ответ тоже экономит лимиты
      })
    });

    const gData = await groqReport.json();

    // Если всё еще лимит - просим подождать красиво
    if (gData.error?.code === "rate_limit_exceeded") {
      return res.status(200).json({ report: "## SYSTEM_OVERLOAD\nRate limit reached. Automatic retry in 5s...", chartData: [] });
    }

    res.status(200).json({ 
      report: gData.choices?.[0]?.message?.content || "## Error\nUnexpected response.", 
      chartData: [] 
    });

  } catch (e) {
    res.status(200).json({ report: `## FAILURE\n${e.message}`, chartData: [] });
  }
}
