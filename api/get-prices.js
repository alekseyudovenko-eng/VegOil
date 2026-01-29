export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  const safeJsonParse = (str) => {
    try {
      const jsonMatch = str.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) { return null; }
  };

  try {
    // Детальный поиск по регионам и маслам
    const query = "Vegetable oils market Jan 29 2026: prices, trends, news. Regions: Europe, Russia, Ukraine, Central Asia, Caucasus. Products: Palm, Soybean, Sunflower, Rapeseed oil, Margarine, Crude oil.";
    
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        max_results: 10
      })
    });
    const searchData = await searchRes.json();
    const context = (searchData.results || []).map(r => r.content).join("\n").slice(0, 5000);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a lead market analyst for the Eurasia region. Provide a structured intelligence report in JSON format." 
          },
          { 
            role: "user", 
            content: `Context: ${context}\n\nTask: Generate a report for Jan 29, 2026.
            Focus on: Europe (incl. Russia/Ukraine), Central Asia, Caucasus.
            Products: Palm, Soybean, Sunflower, Rapeseed oils, Margarine, Crude oil.
            
            Return JSON:
            {
              "executive_summary": "Overall market state in 2-3 sentences",
              "top_news": {
                "Palm": "...", "Soybean": "...", "Sunflower": "...", "Rapeseed": "...", "Margarine": "...", "CrudeOil": "..."
              },
              "regional_updates": [
                {"region": "Europe/CIS", "update": "..."},
                {"region": "Central Asia", "update": "..."},
                {"region": "Caucasus", "update": "..."}
              ],
              "trends": {
                "Palm": "Bullish", "Soybean": "Bearish", "Sunflower": "Bullish", "Rapeseed": "Neutral", "Margarine": "Bullish", "CrudeOil": "Bearish"
              }
            }`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const gData = await groqRes.json();
    const result = safeJsonParse(gData.choices[0].message.content);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
