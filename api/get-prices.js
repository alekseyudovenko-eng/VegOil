export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  try {
    // Собираем данные строго по твоим источникам за 29 января 2026 и неделю до
    const query = "FCPO prices 23-29 January 2026 Bursa Malaysia Star NST Agropost GrainCentral";
    
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        include_domains: [
          "thestar.com.my", 
          "nst.com.my", 
          "graincentral.com", 
          "agropost.wordpress.com",
          "finimize.com"
        ]
      })
    });
    
    const searchData = await searchRes.json();
    const context = searchData.results.map(r => r.content).join("\n");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are a financial analyst. Today is Jan 29, 2026. 
            Extract historical FCPO prices for the LAST 7 DAYS (Jan 23 to Jan 29, 2026) using the provided context. 
            Ensure each date has a unique price. Return ONLY JSON.` 
          },
          { 
            role: "user", 
            content: `Context: ${context}\n\nTask: Return JSON with:
            1. "prices": array of 7 objects {date: "YYYY-MM-DD", close: number}
            2. "analysis": 2-sentence market summary based on the news.
            3. "news": 3 specific headlines from the sources.
            4. "trend": "Bullish" or "Bearish".` 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await groqRes.json();
    res.status(200).json(JSON.parse(data.choices[0].message.content));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
