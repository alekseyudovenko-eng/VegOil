export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(200).json({ executive_summary: "Ошибка: Ключи API не найдены в настройках Vercel." });
  }

  try {
    // Делаем ОДИН быстрый поиск, чтобы не вылететь по тайм-ауту
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Vegetable oil market Jan 29 2026 Europe Russia Ukraine Central Asia prices trends",
        search_depth: "basic",
        max_results: 5
      })
    });
    
    const searchData = await searchRes.json();
    const context = (searchData.results || []).map(r => r.content).join("\n").slice(0, 3000);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a market analyst. Return ONLY JSON." },
          { role: "user", content: `Context: ${context}\n\nProvide Jan 29 2026 report for Europe, CIS, Caucasus on Palm, Soy, Sunflower, Rapeseed, Margarine, Crude Oil. JSON format: {"executive_summary": "...", "top_news": {"Palm": "...", "Soybean": "...", "Sunflower": "...", "Rapeseed": "...", "Margarine": "...", "CrudeOil": "..."}, "regional_updates": [{"region": "Europe", "update": "..."}, {"region": "CIS/Central Asia", "update": "..."}, {"region": "Caucasus", "update": "..."}], "trends": {"Palm": "Bullish"}}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    const gData = await groqRes.json();
    const content = gData.choices[0].message.content;
    res.status(200).json(JSON.parse(content));

  } catch (e) {
    // Вместо ошибки 500 возвращаем 200 с описанием проблемы, чтобы фронт не "висел"
    res.status(200).json({ 
      executive_summary: "Произошла ошибка при сборе данных: " + e.message,
      top_news: {}, regional_updates: [], trends: {}
    });
  }
}
