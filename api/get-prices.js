export default async function handler(req, res) {
  const { category } = req.query;
  
  // Берем ключи (проверь, чтобы в Vercel они были без VITE_)
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(200).json({ report: "### Ошибка: API ключи не настроены" });
  }

  const configs = {
    news: {
      query: "oilworld.ru apk-inform новости рынок подсолнечное масло февраль 2026",
      system: "ТЫ — АНАЛИТИК. Вытащи только новости масличного рынка за февраль 2026. Игнорируй воду и общие рассуждения."
    },
    prices: {
      query: "sunflower oil price USD/MT, Brent oil price, MATIF rapeseed, USD RUB UZS KZT rate February 2026",
      system: "ТЫ — ТЕРМИНАЛ КОТИРОВОК. Вытащи из текста только цифры, цены и курсы. Составь из них таблицы Markdown. Укажи дату для каждой цены."
    },
    policy: {
      query: "экспортная пошлина на подсолнечное масло РФ 2026, пошлины на импорт масла Индия, налоги Узбекистан",
      system: "ТЫ — ЭКСПЕРТ ВЭД. Кратко перечисли текущие пошлины и изменения в законодательстве."
    },
    trade: {
      query: "экспорт импорт статистика подсолнечное масло 2026 производство запасы",
      system: "ТЫ — АНАЛИТИК. Выдай только цифры по торговым балансам и запасам."
    },
    summary: {
      query: "vegetable oil market trends February 2026 analysis",
      system: "ТЫ — СТРАТЕГ. Сделай краткое резюме ситуации за последние 14 дней."
    }
  };

  const current = configs[category] || configs.news;

  try {
    // 1. ПОИСК (Упростили запрос, убрали жесткие site: чтобы не было пустоты)
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
    
    const searchData = await searchRes.json();

    // Проверяем, нашел ли Tavily хоть что-то
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(200).json({ report: "### Данных в источниках за последние 14 дней не найдено." });
    }

    // 2. ГЕНЕРАЦИЯ (Запрещаем лить воду про 'важность анализа')
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
            ПРАВИЛА: 
            1. Пиши только на русском. 
            2. Если в данных нет цифр или фактов по теме — пиши 'НЕТ ДАННЫХ'. 
            3. ЗАПРЕЩЕНО писать лекции о том, как проводится анализ. 
            4. ЗАПРЕЩЕНО упоминать COVID, медицину и прочий мусор.
            5. Только таблицы и списки.` 
          },
          { role: "user", content: `Результаты поиска: ${JSON.stringify(searchData.results)}` }
        ],
        temperature: 0.1 // Минимальный креатив
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
      return res.status(200).json({ report: `### Ошибка API: ${data.error.message}` });
    }

    const report = data.choices[0].message.content;

    // Если ИИ все-таки начал пороть чушь про "важность анализа" (на случай глюка)
    if (report.includes("анализ данных") && report.length > 500 && !report.includes("|")) {
       return res.status(200).json({ report: "### Ошибка: ИИ сгенерировал мусор вместо фактов. Попробуйте обновить." });
    }

    res.status(200).json({ report: report });

  } catch (error) {
    console.error("API Error:", error);
    res.status(200).json({ report: `### Ошибка системы: ${error.message}` });
  }
}
