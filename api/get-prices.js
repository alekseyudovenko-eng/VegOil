export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options);

  try {
    // 1. РАСШИРЕННЫЙ И ТАРГЕТИРОВАННЫЙ ПОИСК
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Ищем конкретно на финансовых ресурсах за последние 2 дня
        query: `Current spot and futures prices (Feb 2026): Crude Palm Oil MYR/T (FCPO), Soybean OIL CBOT, Sunflower OIL price, Rapeseed OIL price Matif, Cottonseed OIL, Brent Crude OIL price`,
        search_depth: "advanced",
        max_results: 10,
        days: 2 
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n") || "";

    // 2. ГЕНЕРАЦИЯ С ЖЕСТКИМИ ПРАВИЛАМИ ПРОВЕРКИ
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodity Analyst. Today is ${dateStr}.
            
            STRICT RULES:
            1. PALM OIL: Use ONLY MYR/T (Malaysian Ringgit).
            2. OIL VS SEEDS: Ensure prices are for OIL, not seeds/meals. If context mentions "Rapeseed" at ~470 EUR, check if it is seeds. Rapeseed OIL is usually higher (~900-1100 EUR). If unsure, state "Data Verification Needed".
            3. BRENT: Check price carefully. It must be Crude Oil price, not a forecast.
            4. COTTONSEED: Use the original currency found in context (e.g., INR, USD).
            
            STRUCTURE:
            ## LIVE QUOTES (${dateStr})
            [SYMBOL] NAME: PRICE CURRENCY/UNIT (CHANGE)

            ## EXECUTIVE ANALYSIS
            Summarize current market state briefly. Focus on the 48h window.` 
          },
          { role: "user", content: `Context data: ${context}` }
        ],
        temperature: 0
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ 
      report: gData.choices?.[0]?.message?.content || "## System Error\nData retrieval failed.",
      chartData: [] 
    });

  } catch (e) {
    res.status(200).json({ report: `## Connection Error\n${e.message}` });
  }
}
