export default async function handler(req, res) {
  const { category } = req.query;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  // ТВОЙ ПРОВЕРОЧНЫЙ СПИСОК САЙТОВ
  const MY_TRUSTED_SITES = [
    "oilworld.ru", 
    "apk-inform.com", 
    "agroinvestor.ru", 
    "investing.com", 
    "tradingeconomics.com",
    "cbr.ru",
    "moex.com",
    "indexmundi.com"
  ];

  const configs = {
    news: {
      query: "рынок растительных масел новости подсолнечное пальмовое рапсовое масло спецжиры",
      system: "ТЫ — ОТРАСЛЕВОЙ АНАЛИТИК. Используй ТОЛЬКО предоставленные данные из поиска. Сделай сводку новостей за последние 14 дней. Если информации нет — пиши 'НЕТ ДАННЫХ В ИСТОЧНИКАХ'."
    },
    prices: {
      query: "курсы валют USD RUB UZS KZT, цены на подсолнечное масло FOB, рапс MATIF, нефть Brent",
      system: "ТЫ — ФИНАНСОВЫЙ ТЕРМИНАЛ. Вытащи из текста цифры и составь таблицы. Обязательно указывай дату котировки, если она есть."
    },
    policy: {
      query: "пошлины на экспорт масла РФ, импортные пошлины Индия ЕС, налоги Узбекистан",
      system: "ТЫ — ЭКСПЕРТ ПО ВЭД. Кратко выпиши действующие ставки и изменения за 14 дней."
    },
    trade: {
      query: "экспорт импорт статистика подсолнечное масло пальмовое масло производство запасы",
      system: "ТЫ — АНАЛИТИК ТОРГОВЛИ. Только цифры по балансам спроса и предложения."
    },
    summary: {
      query: "обзор рынка масел февраль 2026 итоги и прогнозы",
      system: "ТЫ — СТРАТЕГ. Краткое резюме ситуации на основе найденных статей."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 1. ПОИСК ТОЛЬКО ПО ТВОИМ САЙТАМ
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: current.query,
        search_depth: "advanced",
        include_domains: MY_TRUSTED_SITES, // ОГРАНИЧЕНИЕ ЗДЕСЬ
        max_results: 15,
        days: 14
      })
    });
    const searchData = await searchRes.json();

    // 2. ГЕНЕРАЦИЯ ОТЧЕТА (Temperature 0.0 — никакой отсебятины)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `${current.system} 
            РАБОТАЙ СТРОГО С ТЕКСТОМ НИЖЕ. Если в тексте нет нужной информации — не придумывай её. 
            Сегодня 12 февраля 2026. Пиши на русском.` 
          },
          { role: "user", content: `Контент из доверенных источников: ${JSON.stringify(searchData.results)}` }
        ],
        temperature: 0.0 
      })
    });

    const data = await groqResponse.json();
    res.status(200).json({ report: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
