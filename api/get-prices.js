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
        query: `Latest market news Feb 2026: Palm Oil FCPO, Soybean Oil CBOT, Sunflower Oil prices, Rapeseed Oil Matif, Brent Crude analysis`,
        search_depth: "advanced", // Переключаем на advanced для лучшего поиска источников
        max_results: 15,
        days: 7 
      })
    });
    
    const sData = await searchRes.json();
    // Извлекаем не только контент, но и заголовки с именами сайтов для ИИ
    const context = sData.results?.map(r => `SOURCE: ${r.url} | TITLE: ${r.title} | CONTENT: ${r.content}`).join("\n\n") || "";

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodity Intelligence Bot. Today is ${dateStr}.
            
            STRUCTURE YOUR RESPONSE:
            
            ## MARKET QUOTES
            List each commodity: 
            [SYMBOL] NAME: PRICE | BASIS: [Basis] | AS OF: [Date] | SOURCE: [Short domain name]

            ## INTELLIGENCE FEED (Weekly News)
            Provide 5-6 key news bullets. 
            Format: 
            - [DATE] TOPIC: Summary of the news. (Source: [Domain Name])

            ## STRATEGIC SUMMARY
            A brief professional outlook (2 paragraphs).

            RULES:
            - Palm Oil MUST be in MYR/T.
            - If date/source is missing in context, use "Market Consensus" or "Verified News Wire".
            - Style: Cold, Monochromatic, Professional.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ 
      report: gData.choices?.[0]?.message?.content || "## Status\nConnection lost.",
      chartData: [] 
    });

  } catch (e) {
    res.status(200).json({ report: `## ERROR\n${e.message}`, chartData: [] });
  }
}
