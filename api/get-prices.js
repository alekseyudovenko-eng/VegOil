export default async function handler(req, res) {
  const { category } = req.query; // Получаем категорию из запроса
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  // Конфигурация под каждую страницу
  const configs = {
    news: {
      query: "vegetable oils market news February 2026, sunflower oil, palm oil, soy oil prices, logistics crisis",
      system: "ТЫ — ГЛАВНЫЙ РЕДАКТОР НОВОСТЕЙ. Сделай сводку самых важных событий на рынке масел за последние 10 дней. Указывай конкретные страны."
    },
    prices: {
      query: "sunflower oil FOB Novorossiysk, palm oil BMD, rapeseed MATIF, Brent oil price, USD/RUB, USD/TRY, Central Bank rates February 2026",
      system: "ТЫ — ФИНАНСОВЫЙ АНАЛИТИК. Твоя задача — ЦЕНЫ И ВАЛЮТЫ. Выдай курсы валют, ставки ЦБ и котировки масел в таблицах. Сравни с началом февраля."
    },
    policy: {
      query: "Russia sunflower oil export duty February 2026, Kazakhstan oilseed export ban, Uzbekistan import taxes, India edible oil import duty",
      system: "ТЫ — ЭКСПЕРТ ПО ГОСУДАРСТВЕННОМУ РЕГУЛИРОВАНИЮ. Опиши пошлины, квоты и налоги по странам: РФ, Казахстан, Узбекистан, Индия, Китай."
    },
    trade: {
      query: "vegetable oil export import volumes 2026, production stocks consumption by country, Russia, Ukraine, Indonesia, China",
      system: "ТЫ — СПЕЦИАЛИСТ ПО ТОРГОВЫМ ПОТОКАМ. Выдай цифры: Производство, Импорт, Экспорт, Остатки. Сделай акцент на балансе спроса и предложения."
    },
    summary: {
      query: "vegetable oils market outlook 2026, price forecast, main risks and opportunities",
      system: "ТЫ — СТРАТЕГИЧЕСКИЙ АНАЛИТИК. Напиши Executive Summary: краткие выводы по всем блокам и прогноз на ближайший месяц."
    }
  };

  const currentConfig = configs[category] || configs.news;

  try {
    // 1. ПОИСК
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: currentConfig.query,
        search_depth: "advanced",
        max_results: 8
      })
    });
    const searchData = await searchRes.json();

    // 2. ГЕНЕРАЦИЯ ОТЧЕТА
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `${currentConfig.system} Используй Markdown. Для таблиц используй разделители |. Если данных нет, пиши "НЕТ ДАННЫХ".` },
          { role: "user", content: `Данные поиска: ${JSON.stringify(searchData.results)}` }
        ],
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();
    res.status(200).json({ report: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
