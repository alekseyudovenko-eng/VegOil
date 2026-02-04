export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const currentYear = "2026";
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Ищем только на финансовых сайтах, ИСКЛЮЧАЯ соцсети
        query: `latest prices and market news Feb 2026: Palm Oil FCPO MYR, Soybean Oil CBOT, Brent Crude`,
        search_depth: "basic",
        max_results: 10,
        days: 3,
        // Вырезаем мусорные домены
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
            - IGNORE all data and news from 2023, 2024, or 2025. 
            - Use ONLY information explicitly dated February 2026.
            - If you see "2023", discard that entire piece of information.
            
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
