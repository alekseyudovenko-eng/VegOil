export default async function handler(req, res) {
  const { category } = req.query;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  const configs = {
    news: {
      query: "vegetable oils market news Feb 2026: EU, Russia, Ukraine, Kazakhstan, Uzbekistan, Turkey, China, India, Malaysia, Indonesia. Specialty fats and margarine industry.",
      system: "ТЫ — ГЛАВНЫЙ АНАЛИТИК. Сводка по регионам: ЕС, РФ, Украина, Казахстан, Узбекистан, Турция, Китай, Индия. Обязательно: новости по спецжирам и маргаринам."
    },
    prices: {
      query: "actual rates USD/RUB, EUR/RUB, USD/UZS, USD/KZT, Brent oil price, MATIF rapeseed, sunflower oil FOB Novorossiysk February 12 2026",
      system: "ТЫ — ФИНАНСОВЫЙ ТЕРМИНАЛ. Выдай курсы валют (РФ, УЗ, КЗ, ТУР, КИТ, ЕС) и котировки масел. Используй таблицы. Сегодня 12.02.2026."
    },
    policy: {
      query: "EU import duty edible oils Feb 2026, Russia export duty sunflower oil, Uzbekistan VAT, India duty news, Turkey trade regulations",
      system: "ТЫ — ЭКСПЕРТ ПО РЕГУЛИРОВАНИЮ. Анализ пошлин, налогов и квот: ЕС, РФ, Украина, КЗ, УЗ, Турция, Индия."
    },
    trade: {
      query: "production export import stocks 2026: EU, Russia, Ukraine, Kazakhstan, Uzbekistan, China, India, Indonesia, Malaysia. S&D balance.",
      system: "ТЫ — СПЕЦИАЛИСТ ПО ТОРГОВЫМ ПОТОКАМ. Дай цифры: Производство, Экспорт, Импорт, Остатки по списку стран."
    },
    summary: {
      query: "global vegetable oil market analysis Feb-March 2026 forecast EU Russia China India",
      system: "ТЫ — СТРАТЕГИЧЕСКИЙ АНАЛИТИК. Executive Summary и прогноз на месяц."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 1. ПОИСК С ФИЛЬТРОМ 14 ДНЕЙ
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: current.query,
        search_depth: "advanced",
        max_results: 20, 
        days: 14 // Установили окно в 2 недели
      })
    });
    const searchData = await searchRes.json();

    // 2. ГЕНЕРАЦИЯ
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `${current.system} 
            ВАЖНО: Пиши строго на русском. Используй Markdown (| для таблиц). Сегодня 12 февраля 2026 года. 
            Если данных нет — пиши 'ДАННЫЕ ОТСУТСТВУЮТ'. За галлюцинации и старые курсы — бан.` 
          },
          { role: "user", content: `Результаты поиска: ${JSON.stringify(searchData.results)}` }
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
