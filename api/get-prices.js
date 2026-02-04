export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // 1. ПОЛУЧАЕМ ТЕКУЩУЮ ДАТУ
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options); // Пример: "February 4, 2026"

  try {
    // 2. ДИНАМИЧЕСКИЙ ПОИСК (дата подставляется автоматически)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Current prices for ${dateStr}: Palm Oil FCPO, CBOT Soybean Oil, Black Sea Sunflower Oil, Matif Rapeseed Oil, Cottonseed Oil, Brent Crude Oil`,
        search_depth: "basic",
        max_results: 8
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n") || "";

    // 3. ГЕНЕРАЦИЯ С ТЕКУЩЕЙ ДАТОЙ
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Terminal Intelligence. Today is ${dateStr}.
            Create a professional market brief.
            
            STRUCTURE:
            ## LIVE QUOTES (${dateStr})
            List each commodity in this style:
            [SYMBOL] NAME: PRICE UNIT (CHANGE)
            
            Commodities: Palm Oil (FCPO), Soybean Oil, Sunflower Oil, Rapeseed Oil, Cottonseed Oil, Brent Crude.

            ## EXECUTIVE ANALYSIS
            Summarize price movements based on context. 
            Focus ONLY on latest available data.
            
            STYLE: Cold, industrial, monochromatic, no emojis.` 
          },
          { role: "user", content: `Data: ${context}` }
        ],
        temperature: 0
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ 
      report: gData.choices?.[0]?.message?.content || "## System Error\nData unavailable.",
      chartData: [] 
    });

  } catch (e) {
    res.status(200).json({ report: `## Connection Error\n${e.message}` });
  }
}
