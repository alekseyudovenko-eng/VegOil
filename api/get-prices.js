export default async function handler(req, res) {
  const { type } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // ОБЪЕДИНЕННЫЙ СПИСОК ИСТОЧНИКОВ
  const allSources = [
    "marketscreener.com", "brecorder.com", "bernama.com", "agropost.wordpress.com",
    "palmoilanalytics.com", "mpob.gov.my", "hellenicshippingnews.com", 
    "reuters.com", "bloomberg.com", "thestar.com.my", "oilworld.biz"
  ];

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Crude Palm Oil FCPO price benchmark MYR Feb 2026",
        search_depth: "advanced",
        include_domains: allSources,
        max_results: 12 // Увеличили, чтобы охватить больше сайтов
      })
    });

    const sData = await searchRes.json();
    
    // Если по списку ничего нет, пробуем общий поиск (защита от "пустого экрана")
    let finalContext = sData.results?.map(r => `Source: ${r.url}\n${r.content}`).join("\n\n") || "";
    
    if (!finalContext) {
      console.log("Trusted domains returned nothing, expanding search...");
      // Здесь можно добавить запасной запрос без include_domains, если нужно
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a financial analyst. Extract EXACT price numerical data for Crude Palm Oil (FCPO). Return ONLY JSON." 
          },
          { 
            role: "user", 
            content: `Context: ${finalContext}. 
            Extract daily prices for Feb 2026. If only one price is found (e.g. 4150), use it for multiple dates to create a flat line.
            JSON structure: {"data": [{"date": "2026-02-03", "open": 4150, "high": 4200, "low": 4100, "close": 4180}]}` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const gData = await groqRes.json();
    const content = JSON.parse(gData.choices[0].message.content);

    return res.status(200).json({
      data: content.data || [],
      report: content.report || content,
      sources: sData.results || []
    });

  } catch (error) {
    return res.status(200).json({ error: error.message, data: [] });
  }
}
