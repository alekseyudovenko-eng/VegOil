export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const currentYear = new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Top market driver news Feb 2026: Palm Oil FCPO, Soybean Oil CBOT, Sunflower Oil Black Sea, Rapeseed Oil MATIF, Cottonseed Oil, Brent Crude, Indonesia Malaysia palm tax, Brazil Soy harvest, Ukraine Sunflower supply`,
        search_depth: "advanced", // Здесь нужен advanced для поиска именно "самых цитируемых"
        max_results: 15,
        days: 7,
        exclude_domains: ["facebook.com", "linkedin.com", "instagram.com", "x.com"]
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => `SOURCE: ${r.url} | TITLE: ${r.title} | CONTENT: ${r.content}`).join("\n\n");

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Chief Market Editor. Today is ${dateStr}. 
            Based on the context, select ONLY ONE (1) most critical and cited news per category for the last 7 days.
            
            STRUCTURE:
            
            ## PRODUCT INTELLIGENCE
            Select the #1 most important news for each:
            - PALM OIL
            - SOYBEAN OIL
            - SUNFLOWER OIL
            - RAPESEED OIL
            - COTTONSEED OIL
            - BRENT CRUDE
            Format: [PRODUCT NAME] | [DATE] : [Summary] (Source: domain.com)

            ## REGIONAL INTELLIGENCE
            Select the #1 most important news for each:
            - INDONESIA/MALAYSIA
            - USA/BRAZIL
            - BLACK SEA REGION (UKRAINE/RUSSIA)
            - EUROPEAN UNION
            - INDIA/CHINA
            Format: [REGION] | [DATE] : [Summary] (Source: domain.com)

            RULES:
            - If no specific news found for a category, use "No significant volatility reported."
            - Ensure the source is a reputable financial outlet.
            - IGNORE any data not from ${currentYear}.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ report: gData.choices?.[0]?.message?.content, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## ERROR\n${e.message}` });
  }
}
