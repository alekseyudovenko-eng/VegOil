export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY; // Твой новый ключ

  try {
    // 1. ПОИСК В РЕАЛЬНОМ ВРЕМЕНИ
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "current Crude Palm Oil FCPO price Bursa Malaysia today news",
        search_depth: "advanced",
        include_answer: true
      })
    });
    const searchResults = await searchResponse.json();
    const context = searchResults.results.map(r => r.content).join("\n");

    // 2. ОБРАБОТКА ДАННЫХ ЧЕРЕЗ GROQ
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a data extractor. Use the provided web search context to return ONLY JSON. 
            Context: ${context}`
          },
          {
            role: "user",
            content: `Based on the context, extract: 
            1. Last 7-10 days prices for FCPO (if dates missing, use current date and estimate backwards realistically).
            2. Market analysis summary.
            3. 3 latest news headlines.
            4. Current trend.
            Format: {"prices": [{"date": "YYYY-MM-DD", "close": number, ...}], "analysis": "", "news": [], "trend": ""}`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const finalData = await groqResponse.json();
    res.status(200).json(JSON.parse(finalData.choices[0].message.content));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch online data" });
  }
}
