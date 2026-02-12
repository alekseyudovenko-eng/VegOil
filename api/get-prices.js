export default async function handler(req, res) {
  // Проверяем категорию
  const { category } = req.query;
  
  // ПРОБЛЕМА ТУТ: Убедись, что ключи в Vercel названы именно так!
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  // Если ключей нет, не падаем с 500, а пишем в чем дело
  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(200).json({ report: "Ошибка: Не настроены API ключи на сервере (GROQ_API_KEY / TAVILY_API_KEY)." });
  }

  const configs = {
    news: { query: "рынок растительных масел новости подсолнечное пальмовое масло", system: "Аналитик." },
    prices: { query: "sunflower oil price MATIF rapeseed Brent oil rates USD RUB KZT UZS", system: "Финансист." },
    policy: { query: "пошлины на экспорт масла РФ Узбекистан Индия", system: "ВЭД." },
    trade: { query: "экспорт импорт статистика масла подсолнечного", system: "Торговля." },
    summary: { query: "market outlook vegetable oils forecast", system: "Стратег." }
  };

  const current = configs[category] || configs.news;

  try {
    // Поиск
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: current.query,
        search_depth: "advanced",
        max_results: 10,
        days: 14 
      })
    });
    
    const searchData = await searchRes.json();

    // Генерация
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `${current.system} Пиши на русском. Используй Markdown.` },
          { role: "user", content: `Данные: ${JSON.stringify(searchData.results)}` }
        ],
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();
    
    // Если Groq вернул ошибку (например, кончились токены)
    if (data.error) {
      return res.status(200).json({ report: `Ошибка API: ${data.error.message}` });
    }

    res.status(200).json({ report: data.choices[0].message.content });
  } catch (error) {
    // Логируем ошибку в консоль сервера
    console.error("DETAILED ERROR:", error);
    res.status(200).json({ report: `Ошибка сервера: ${error.message}` });
  }
}
