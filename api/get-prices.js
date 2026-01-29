// Используем встроенный fetch (Node.js 18+)
export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  // Если ключей нет, сразу выходим, не мучая сервер
  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(200).json({ executive_summary: "API Keys missing in Vercel settings." });
  }

  try {
    // 1. Быстрый поиск (базовая глубина, меньше результатов)
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Vegetable oil market Jan 29 2026 Europe CIS prices trends",
        search_depth: "basic",
        max_results: 3 // Уменьшили количество, чтобы ускорить процесс
      })
    });
    
    const searchData = await searchResponse.json();
    const context = (searchData.results || []).map(r => r.content).join("\n").slice(0, 2000);

    // 2. Запрос к Groq с жестким ограничением токенов (для скорости)
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a market analyst. Return ONLY JSON. Today is Jan 29, 2026." },
          { role: "user", content: `Context: ${context}\n\nTask: Report for Europe/CIS on Palm, Soy, Sunflower, Rapeseed, Margarine, Crude Oil. JSON: {"executive_summary": "...", "top_news": {"Palm": "..."}, "regional_updates": [{"region": "...", "update": "..."}], "trends": {"Palm": "Bullish"}}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000 // Ограничили объем ответа
      })
    });

    const gData = await groqResponse.json();
    if (!gData.choices) throw new Error("Groq failed");

    res.status(200).json(JSON.parse(gData.choices[0].message.content));

  } catch (e) {
    console.error("Critical Error:", e.message);
    // ВАЖНО: возвращаем 200 и объект с ошибкой, чтобы фронтенд не "висел"
    res.status(200).json({ 
      executive_summary: "Service temporarily unavailable. Please try again later.",
      top_news: { "Status": "Data fetch failed" },
      regional_updates: [],
      trends: {}
    });
  }
}
