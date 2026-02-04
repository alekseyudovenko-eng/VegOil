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
        // Снайперский запрос по конкретным базисам
        query: `Current prices Feb 4 2026: Palm Oil FCPO MYR Bursa Malaysia, Soybean Oil CBOT futures, Sunflower Oil FOB Black Sea, Rapeseed Oil MATIF EUR, Brent Crude ICE USD`,
        search_depth: "basic",
        max_results: 10,
        days: 2
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => `SOURCE: ${r.url} | CONTENT: ${r.content}`).join("\n\n") || "";

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Terminal Intelligence. Today is ${dateStr}.
            
            1. Section "## MARKET QUOTES":
               - Use ONLY this format: [SYMBOL] NAME: PRICE | BASIS | DATE | SOURCE
               - PALM OIL: Show price in MYR/T (target ~4219).
               - SOYBEAN OIL: Use USd/lb (CBOT).
               - SUNFLOWER OIL: Use USD/T (FOB Black Sea).
               - RAPESEED OIL: Use EUR/T (MATIF).
               - BRENT: Use USD/bbl (ICE).
               - COTTONSEED OIL: Use original currency found.

            2. Section "## INTELLIGENCE FEED":
               - List 4-5 key news from the context.
               - Format: - [DATE] TOPIC: Summary. (Source: domain.com)

            3. Section "## STRATEGIC SUMMARY":
               - Professional 2-paragraph analysis.
            
            Style: Monochromatic, industrial, no emojis.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ report: gData.choices?.[0]?.message?.content || "## Error\nAI failed to format data.", chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## SYSTEM_DIAGNOSTICS\nError: ${e.message}`, chartData: [] });
  }
}
