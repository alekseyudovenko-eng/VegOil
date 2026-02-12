export default async function handler(req, res) {
  const { category } = req.query;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  const configs = {
    news: {
      query: "vegetable oils market news Russia EU Ukraine Kazakhstan Uzbekistan Turkey China India Malaysia Indonesia specialty fats margarine Feb 2026",
      system: "ТЫ — АНАЛИТИК. Твоя задача — собрать ВСЕ важные новости и события за ПОСЛЕДНИЕ 14 ДНЕЙ. Не ограничивайся сегодняшним днем. Группируй по странам."
    },
    prices: {
      query: "price dynamics sunflower oil palm oil rapeseed Brent currency rates USD/RUB UZS KZT CNY TRY Feb 2026 last 14 days",
      system: "ТЫ — ФИНАНСОВЫЙ ЭКСПЕРТ. Покажи динамику цен и курсов за ПОСЛЕДНИЕ 14 ДНЕЙ. Сделай таблицы. Если видишь изменение цены за этот период — отрази это."
    },
    policy: {
      query: "changes in export import duties taxes regulations edible oils Russia EU Uzbekistan Kazakhstan India Turkey last 14 days",
      system: "ТЫ — ЭКСПЕРТ ПО ВЭД. Собери все изменения в регуляторке, пошлинах и налогах, которые произошли или обсуждались за ПОСЛЕДНИЕ 14 ДНЕЙ."
    },
    trade: {
      query: "vegetable oil trade flows export import production stocks statistics Feb 2026 Russia Ukraine Kazakhstan Uzbekistan EU China",
      system: "ТЫ — АНАЛИТИК РЫНКА. Дай сводку по торговым балансам и логистике на основе данных за последние 14 дней."
    },
    summary: {
      query: "summary of vegetable oil market trends and outlook February 2026",
      system: "ТЫ — СТРАТЕГ. Сделай Executive Summary главных событий и трендов за ПОСЛЕДНИЕ 14 ДНЕЙ."
    }
  };

  const current = configs[category] || configs.news;

  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: current.query,
        search_depth: "advanced",
        max_results: 20,
        days: 14 // Жестко ищем за 2 недели
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
            content: `${current.system} Пиши строго на русском. Используй Markdown. Сегодня 12 февраля 2026. Твоя цель — МАКСИМУМ информации за последние 14 дней. Не смей писать 'нет данных', если в тексте есть хоть какие-то цифры или новости за февраль.` 
          },
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
