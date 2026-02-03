export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  try {
    // 1. Поиск свежих данных по твоим регионам
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Vegetable oils market prices news Jan 29 2026 Europe, Russia, Ukraine, Central Asia, Caucasus. Palm, Sunflower, Soybean, Rapeseed, Margarine, Crude Oil.",
        search_depth: "basic"
      })
    });
    const searchData = await searchRes.json();
    const context = (searchData.results || []).map(r => r.content).join("\n").slice(0, 3000);

    // 2. Генерация отчета через Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional market analyst. Return ONLY JSON." },
          { role: "user", content: `Context: ${context}\n\nDate: Jan 29, 2026. Regions: Europe, CIS, Caucasus. Products: Palm, Soybean, Sunflower, Rapeseed, Margarine, Crude oil.
            Provide: 
            1. executive_summary (2 sentences)
            2. top_news (object with news for each oil)
            3. regional_analysis (array of 3 objects: region, update)
            4. trends (object: product -> Bullish/Bearish)` }
        ],
        response_format: { type: "json_object" }
      })
    });

    const gData = await groqRes.json();
    res.status(200).json(JSON.parse(gData.choices[0].message.content));
  } catch (e) {
    res.status(200).json({ executive_summary: "Ошибка: " + e.message, top_news: {}, regional_analysis: [], trends: {} });
  }
}
