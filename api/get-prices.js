export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const now = new Date();
  const startLimit = new Date();
  startLimit.setDate(now.getDate() - 7); // Ровно 7 дней назад

  // Строка для поиска и системного промпта
  const timeFrame = `from ${startLimit.toDateString()} to ${now.toDateString()}`;

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Agricultural market drivers and news ${timeFrame}: Europe, CIS, Central Asia, Edible Oils, Brent Crude`,
        search_depth: "advanced",
        max_results: 20,
        days: 7 // Системное ограничение Tavily
      })
    });
    
    const sData = await searchRes.json();
    
    // Подготовка данных с явным указанием даты для ИИ
    const context = sData.results?.map(r => 
      `[PUBLISHED_DATE: ${r.published_date || 'UNKNOWN'}] SOURCE: ${r.url} | CONTENT: ${r.content}`
    ).join("\n\n");

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are a Commodity Intelligence Terminal. 
            STRICT TEMPORAL WINDOW: ${timeFrame}.
            
            OPERATIONAL RULES:
            1. MANDATORY: Discard any news labeled 'UNKNOWN' or dated before ${startLimit.toDateString()}.
            2. MANDATORY: Only 2026 data is allowed.
            3. Use these exact sections:
            
            1. ## EXECUTIVE SUMMARY
            2. ## PRICE DYNAMICS (Status: Pending)
            3. ## PRODUCTION AND TRADE FLOWS (One key news per relevant country/product)
            4. ## POLICY AND REGULATORY CHANGES (One key news per relevant country/product)
            5. ## CONCLUSIONS

            Tone: Cold, professional, analytical.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ report: gData.choices?.[0]?.message?.content, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## ERROR\n${e.message}` });
  }
}
