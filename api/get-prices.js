export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // 1. ТАРГЕТИРОВАННЫЙ ПОИСК (с ограничением по качественным сайтам)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Ищем только на авторитетных ресурсах
        query: `site:tradingeconomics.com, investing.com, reuters.com price today: Palm Oil FCPO MYR, Soybean Oil CBOT, Sunflower Oil FOB, Brent Crude`,
        search_depth: "basic",
        max_results: 8,
        days: 2
      })
    });
    
    const sData = await searchRes.json();
    
    // Чистим контекст: убираем лишние пробелы и мусор
    const context = sData.results?.map(r => 
      `[${new URL(r.url).hostname}] ${r.content.replace(/\s+/g, ' ').substring(0, 500)}`
    ).join("\n") || "";

    // 2. ИИ-АНАЛИТИК С ПРАВОМ НА ОТКАЗ
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a strict Commodity Terminal. 
            Rules:
            1. If price not found for a commodity, write "DATA_MISSING". Do NOT guess.
            2. Palm Oil: Must be in MYR/T.
            3. Verification: Double check Rapeseed. If price is ~400-500, it's SEEDS (Seeds are not Oil).
            
            Structure:
            ## LIVE QUOTES
            [SYMBOL] NAME: PRICE | BASIS | DATE | SOURCE
            
            ## INTELLIGENCE FEED
            - [DATE] TOPIC (Source)
            
            ## ANALYSIS
            2 brief professional paragraphs.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0 // Никакой фантазии
      })
    });

    const gData = await groqReport.json();
    
    if (gData.error?.code === "rate_limit_exceeded") {
       return res.status(200).json({ report: "## RATE_LIMIT\nSystem cooling down. Please wait 10s.", chartData: [] });
    }

    res.status(200).json({ report: gData.choices?.[0]?.message?.content, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## ERROR\n${e.message}` });
  }
}
