export default async function handler(req, res) {
  const { timeframe } = req.query;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY; // Получи бесплатно на tavily.com

  try {
    // 1. ПОИСК РЕАЛЬНЫХ ДАННЫХ
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Crude Palm Oil FCPO price Bursa Malaysia ${timeframe} trends news`,
        search_depth: "basic"
      })
    });
    const searchData = await searchRes.json();
    const context = searchData.results.map(r => r.content).join("\n").slice(0, 5000);

    // 2. ОБРАБОТКА В GROQ
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a market analyst. Use the context to return ONLY JSON." },
          { role: "user", content: `Context: ${context}\n\nReturn JSON: {"prices": [{"date": "YYYY-MM-DD", "close": 123}], "analysis": "...", "news": ["...", "..."], "trend": "Bullish/Bearish"}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await groqRes.json();
    if (!data.choices) throw new Error("Groq returned no choices");
    
    res.status(200).json(JSON.parse(data.choices[0].message.content));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
