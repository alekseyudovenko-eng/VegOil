export default async function handler(req, res) {
  const { category } = req.query;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  const configs = {
    news: {
      query: "site:oilworld.ru OR site:apk-inform.com OR site:agroinvestor.ru новости рынок растительных масел подсолнечное пальмовое спецжиры",
      system: "ТЫ — ОТРАСЛЕВОЙ АНАЛИТИК. Собери актуальные новости рынка масел и жиров. Группируй по странам и темам (производство, логистика, компании)."
    },
    prices: {
      query: "site:tradingeconomics.com OR site:investing.com OR site:oilworld.ru sunflower oil prices, MATIF rapeseed, palm oil BMD, Brent, USD/RUB USD/UZS USD/KZT",
      system: "ТЫ — ФИНАНСОВЫЙ ЭКСПЕРТ. Вытащи из текста все доступные котировки и курсы валют. Сформируй четкие таблицы. Укажи дату для каждой цены, если она есть в источнике."
    },
    policy: {
      query: "site:interfax.ru OR site:customs.gov.ru экспортная пошлина подсолнечное масло РФ, импортные пошлины Индия, налоги Узбекистан",
      system: "ТЫ — ЭКСПЕРТ ПО ВЭД. Найди данные по пошлинам, квотам и налогам. Опиши действующие ставки и анонсированные изменения."
    },
    trade: {
      query: "site:apk-inform.com OR site:oilworld.ru экспорт импорт статистика подсолнечное масло производство запасы",
      system: "ТЫ — АНАЛИТИК ТОРГОВЛИ. Собери цифры по объемам экспорта, импорта и остатков продукции по ключевым регионам."
    },
    summary: {
      query: "market outlook vegetable oils forecast Russia EU China India Uzbekistan",
      system: "ТЫ — СТРАТЕГ. Сделай краткое резюме главных трендов рынка на основе найденной информации."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 1. ПОИСК (Используем site: для точности и days: 14 для свежести)
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: current.query,
        search_depth: "advanced",
        max_results: 15,
        days: 14 
      })
    });
    
    if (!searchRes.ok) throw new Error(`Tavily error: ${searchRes.status}`);
    const searchData = await searchRes.json();

    // 2. ГЕНЕРАЦИЯ (Минимум ограничений — максимум фактов)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `${current.system} 
            Пиши строго на русском языке. Используй Markdown для оформления заголовков и таблиц. 
            Твоя задача — извлечь максимум фактов из предоставленного текста. 
            Если данных по какому-то пункту нет, просто пропусти его.` 
          },
          { role: "user", content: `Результаты поиска для анализа: ${JSON.stringify(searchData.results)}` }
        ],
        temperature: 0.1
      })
    });

    if (!groqResponse.ok) throw new Error(`Groq error: ${groqResponse.status}`);
    const data = await groqResponse.json();

    res.status(200).json({ report: data.choices[0].message.content });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
