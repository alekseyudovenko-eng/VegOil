export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  // Функция-помощник для запроса к Groq
  async function fetchGroq(systemPrompt, userPrompt) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });
    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  try {
    // КАНАЛ 1: ПОИСК И ГЕНЕРАЦИЯ ЦЕН (FCPO 7 Days)
    const priceTask = (async () => {
      const s = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_KEY,
          query: "FCPO palm oil daily prices Jan 23-29 2026 Bursa Malaysia",
          search_depth: "basic"
        })
      });
      const data = await s.json();
      return fetchGroq(
        "You are a price extractor. Return ONLY JSON.",
        `Context: ${JSON.stringify(data.results)}\n\nExtract 7-day price history for FCPO Jan 23-29 2026. Format: {"prices": [{"date":"YYYY-MM-DD", "close":3950}]}`
      );
    })();

    // КАНАЛ 2: МАРКЕТ-АНАЛИЗ И НОВОСТИ (Multi-Commodity)
    const analysisTask = (async () => {
      const s = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_KEY,
          query: "Palm, Sunflower, Soybean oil market news Jan 29 2026 report policy updates",
          search_depth: "advanced"
        })
      });
      const data = await s.json();
      return fetchGroq(
        "You are a market analyst. Return ONLY JSON.",
        `Context: ${JSON.stringify(data.results)}\n\nGenerate: summary, topNews(6 commodities), policy(list), trends(6 commodities).`
      );
    })();

    // Запускаем оба канала одновременно
    const [priceResult, analysisResult] = await Promise.all([priceTask, analysisTask]);

    // Склеиваем результаты
    res.status(200).json({
      ...priceResult,
      ...analysisResult
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка одного из каналов данных" });
  }
}
