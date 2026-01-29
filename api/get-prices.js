export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  try {
    // Расширенный поиск по всем категориям из твоего запроса
    const query = "Vegetable oils market report Jan 29 2026: Palm, Sunflower, Soybean, Rapeseed Oil, Margarine, Crude Oil prices and policy updates";
    
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        max_results: 8
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
            content: "You are a senior market intelligence analyst. Provide a structured report based on the context. Return ONLY JSON." 
          },
          { 
            role: "user", 
            content: `Context: ${context}\n\nTask: Generate a report for Jan 29, 2026.
            IMPORTANT: Round all prices to the nearest whole number (no decimals).
            JSON structure:
            {
              "prices": [{"date": "YYYY-MM-DD", "close": 3950}], 
              "summary": "Executive summary here...",
              "topNews": { "Palm": "", "Sunflower": "", "Soybean": "", "Rapeseed": "", "Margarine": "", "CrudeOil": "" },
              "policy": ["Update 1", "Update 2"],
              "trends": { "Palm": "Bullish", "Sunflower": "Neutral", "Soybean": "Bearish", "Rapeseed": "", "Margarine": "", "CrudeOil": "" }
            }` 
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
