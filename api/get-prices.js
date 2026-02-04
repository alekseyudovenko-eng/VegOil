export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // 1. ПОЛУЧАЕМ ТЕКУЩИЕ ДАННЫЕ В МОМЕНТ ЗАПРОСА
  const now = new Date();
  const currentYear = now.getFullYear().toString(); // Автоматически 2026, 2027 и т.д.
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Динамический год в поисковом запросе
        query: `latest prices and market news ${currentYear}: Palm Oil FCPO MYR, Soybean Oil CBOT, Brent Crude`,
        search_depth: "basic",
        max_results: 10,
        days: 2,
        exclude_domains: ["facebook.com", "linkedin.com", "twitter.com", "x.com", "instagram.com"]
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => `[SOURCE: ${r.url}] [TITLE: ${r.title}] ${r.content.substring(0, 600)}`).join("\n\n");

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Commodity Analyst. Current date is ${dateStr}.
            
            STRICT FILTER:
            - Use ONLY information explicitly dated for the current year: ${currentYear}.
            - Discard any historical data from previous years unless it's for 1-week comparison.
            - If a source mentions a year other than ${currentYear}, ignore its prices.
            
            OUTPUT SECTIONS:
            1. ## MARKET QUOTES: [SYMBOL] NAME: PRICE | BASIS | DATE | SOURCE
            2. ## INTELLIGENCE FEED: - [DATE] TOPIC (Source)
            3. ## SUMMARY: Brief professional outlook.` 
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
