export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Price Feb 4 2026: Palm Oil FCPO MYR, Soybean Oil CBOT, Sunflower Oil FOB, Rapeseed Oil MATIF, Brent Crude ICE`,
        search_depth: "basic",
        max_results: 6 // Уменьшили, чтобы не перегружать ИИ
      })
    });
    
    const sData = await searchRes.json();
    
    // Если результатов нет - выводим это сразу
    if (!sData.results || sData.results.length === 0) {
      return res.status(200).json({ report: "## SYSTEM_ERROR\nSearch returned no results. Check API Key.", chartData: [] });
    }

    // Ограничиваем длину контента от каждого сайта (первые 1000 символов)
    const context = sData.results.map(r => `[SOURCE: ${r.url}] ${r.content.substring(0, 1000)}`).join("\n\n");

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Пробуем 8b, но с ОЧЕНЬ коротким и понятным промптом
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `Terminal Intelligence. Current date: ${dateStr}. 
            Format the following data into:
            1. ## MARKET QUOTES: [SYMBOL] NAME: PRICE | BASIS | DATE | SOURCE
            2. ## INTELLIGENCE FEED: - [DATE] TOPIC (Source)
            3. ## SUMMARY: 2 brief paragraphs.
            Constraint: Palm Oil in MYR/T only.` 
          },
          { role: "user", content: `Data: ${context}` }
        ],
        temperature: 0,
        max_tokens: 800 // Ограничиваем длину ответа для скорости
      })
    });

    const gData = await groqReport.json();
    
    // Проверка на ошибки Groq (например, превышение лимита токенов)
    if (gData.error) {
      return res.status(200).json({ report: `## GROQ_ERROR\n${gData.error.message}`, chartData: [] });
    }

    const finalReport = gData.choices?.[0]?.message?.content;

    res.status(200).json({ 
      report: finalReport || "## Error\nAI returned empty content. Try refreshing.", 
      chartData: [] 
    });

  } catch (e) {
    res.status(200).json({ report: `## CRITICAL_FAILURE\n${e.message}`, chartData: [] });
  }
}
