export default async function handler(req, res) {
  // Добавляем CORS заголовки на всякий случай
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { type } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  // ПРОВЕРКА: Если в Vercel ты назвал ключ просто GROQ_API_KEY, исправь здесь!
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // Проверка ключей
    if (!TAVILY_KEY || !GROQ_KEY) {
      return res.status(200).json({ 
        error: "DEBUG: Missing Keys", 
        tavily: !!TAVILY_KEY, 
        groq: !!GROQ_KEY,
        data: [], 
        report: null 
      });
    }

    // Поиск
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Crude Palm Oil FCPO price chart data February 2026",
        search_depth: "basic"
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Tavily error: ${searchResponse.status}`);
    }

    const sData = await searchResponse.json();
    const context = sData.results?.map(r => r.content).join("\n") || "";

    // Запрос к Groq
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return ONLY JSON." },
          { role: "user", content: `Context: ${context}. If type is chart, return {"data": [...]}. If report, return {"report": {...}}. Current type: ${type}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq error: ${groqResponse.status}`);
    }

    const gData = await groqResponse.json();
    const result = JSON.parse(gData.choices[0].message.content);

    return res.status(200).json({
      ...result,
      sources: sData.results || []
    });

  } catch (error) {
    // ВМЕСТО 500 ВОЗВРАЩАЕМ 200 С ОШИБКОЙ, ЧТОБЫ УВИДЕТЬ ЕЁ В БРАУЗЕРЕ
    return res.status(200).json({ 
      error: "Caught Error", 
      message: error.message,
      data: [],
      report: null
    });
  }
}
