export default async function handler(req, res) {
  // Используем твой ключ Groq
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const SERPER_KEY = process.env.SERPER_API_KEY;

  const query = "sunflower oil prices FOB Black Sea, Russian export duties February 2026, Brent oil price";

  try {
    // 1. ПОИСК (Параллельно Tavily и Serper)
    const searchResults = await Promise.allSettled([
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: 3 })
      }).then(r => r.json()),
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: "ru", hl: "ru", num: 3 })
      }).then(r => r.json())
    ]);

    let context = "";
    if (searchResults[0].status === 'fulfilled') {
      context += searchResults[0].value.results?.map(r => r.content).join("\n") || "";
    }
    if (searchResults[1].status === 'fulfilled') {
      context += searchResults[1].value.organic?.map(r => r.snippet).join("\n") || "";
    }

    // 2. ГЕНЕРАЦИЯ ЧЕРЕЗ GROQ (Llama 3 70B - очень мощная)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Топовая модель на Groq
        messages: [
          { 
            role: "system", 
            content: "Ты — профессиональный агро-аналитик. Пиши отчеты на русском языке, используя таблицы Markdown." 
          },
          { 
            role: "user", 
            content: `Сформируй рыночный отчет на 7 февраля 2026 года на основе этих данных:\n${context}` 
          }
        ],
        temperature: 0.2
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
      return res.status(200).json({ report: `## Ошибка Groq\n${data.error.message}` });
    }

    const report = data.choices?.[0]?.message?.content;
    res.status(200).json({ report: report || "Groq не смог сгенерировать текст." });

  } catch (e) {
    res.status(200).json({ report: `## Ошибка системы\n${e.message}` });
  }
}
