export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // 1. УСКОРЕННЫЙ ПОИСК (меньше результатов = выше скорость)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `palm oil FCPO, soybean oil CBOT, sunflower oil prices Feb 4 2026`,
        search_depth: "basic", // "basic" работает быстрее чем "advanced"
        max_results: 5
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n") || "No news.";

    // 2. ГЕНЕРАЦИЯ С ЧЕТКИМ ШАБЛОНОМ ТАБЛИЦЫ
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Terminal AI. Date: Feb 4, 2026.
            Instructions:
            1. Start with "## CURRENT PRICES".
            2. Create a Markdown table EXACTLY like this:
            | Commodity | Price | Unit |
            |-----------|-------|------|
            | CPO (FCPO) | 4215 | MYR/T |
            3. Follow with "## MARKET ANALYSIS".
            4. Use cold, brief style.` 
          },
          { role: "user", content: `Data: ${context}` }
        ],
        temperature: 0
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ 
      report: gData.choices?.[0]?.message?.content || "## System Error\nCore offline.",
      chartData: [] 
    });

  } catch (e) {
    res.status(200).json({ report: `## Connection Error\n${e.message}` });
  }
}
