export default async function handler(req, res) {
  const { category } = req.query;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  const configs = {
    news: {
      query: "vegetable oils market news Feb 2026: EU (European Union), Russia, Ukraine, Kazakhstan, Uzbekistan, Turkey, China, India, Malaysia, Indonesia. Specialty fats and margarine industry.",
      system: "ТЫ — ГЛАВНЫЙ АНАЛИТИК. Сводка за 10 дней по регионам: ЕС, РФ, Украина, Казахстан, Узбекистан, Турция, Китай, Индия. Обязательно: новости по спецжирам, маргаринам и европейскому рынку."
    },
    prices: {
      query: "sunflower oil FOB, palm oil BMD, rapeseed oil MATIF Paris, soy oil, Brent, USD/RUB, USD/UZS, USD/KZT, USD/TRY, USD/CNY, EUR/USD Feb 2026",
      system: "ТЫ — ФИНАНСОВЫЙ АНАЛИТИК. Выдай таблицы: 1. Курсы валют и ставки ЦБ (РФ, УЗ, КЗ, Турция, Китай, ЕС), 2. Котировки масел (вкл. MATIF), нефти и жиров."
    },
    policy: {
      query: "EU import duty edible oils Feb 2026, Russia export duty sunflower oil, Uzbekistan VAT news, India duty, Turkey trade regs, Indonesia palm levy",
      system: "ТЫ — ЭКСПЕРТ ПО РЕГУЛИРОВАНИЮ. Анализ пошлин, налогов и квот: ЕС (импорт), РФ (экспорт), Украина, КЗ, УЗ, Турция, Индия."
    },
    trade: {
      query: "production export import stocks 2026: EU, Russia, Ukraine, Kazakhstan, Uzbekistan, China, India, Indonesia, Malaysia. S&D balance.",
      system: "ТЫ — СПЕЦИАЛИСТ ПО ТОРГОВЫМ ПОТОКАМ. Дай цифры: Производство, Экспорт, Импорт, Остатки по ЕС и остальному списку стран."
    },
    summary: {
      query: "global vegetable oil market analysis Feb-March 2026 forecast EU Russia China India",
      system: "ТЫ — СТРАТЕГИЧЕСКИЙ АНАЛИТИК. Executive Summary и прогноз с упором на корреляцию рынков ЕС, РФ и Азии."
    }
  };

  const currentConfig = configs[category] || configs.news;

  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: currentConfig.query,
        search_depth: "advanced",
        max_results: 15
      })
    });
    const searchData = await searchRes.json();

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `${currentConfig.system} Пиши строго на русском. Используй Markdown. Для таблиц ОБЯЗАТЕЛЬНО используй |. Если данных нет — не выдумывай, пиши 'ДАННЫЕ ОТСУТСТВУЮТ'.` 
          },
          { role: "user", content: `Контент из поиска: ${JSON.stringify(searchData.results)}` }
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
