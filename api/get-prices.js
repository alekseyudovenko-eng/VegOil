export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const SERPER_KEY = process.env.SERPER_API_KEY;

  // Логика дат:
  const today = new Date("2026-02-07"); // Фиксируем "сегодня" для точности
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7);
  
  const dateRange = `from ${lastWeekStart.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;

  try {
    // Поиск данных СТРОГО за вычисленный период по списку стран из образца
    const query = `vegetable oil prices news ${dateRange} Russia, Ukraine, Kazakhstan, Belarus, Uzbekistan, EU ports`;

    const searchResults = await Promise.allSettled([
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: TAVILY_KEY, 
          query: query,
          search_depth: "advanced",
          max_results: 10
        })
      }).then(r => r.json()),
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: `цены на масло пошлины ${dateRange} РФ Украина Казахстан`, 
          tbs: "qdr:w", // Фильтр Google за неделю
          gl: "ru" 
        })
      }).then(r => r.json())
    ]);

    let context = "";
    if (searchResults[0].status === 'fulfilled') context += JSON.stringify(searchResults[0].value);
    if (searchResults[1].status === 'fulfilled') context += JSON.stringify(searchResults[1].value);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `Ты — аналитик. Твоя задача — отчет за период ${dateRange}.
            СПИСОК СТРАН: Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan.
            Язык: РУССКИЙ.` 
          },
          { 
            role: "user", 
            content: `Используя данные: ${context}, сформируй отчет строго по структуре твоего образца.
            
            ОБЯЗАТЕЛЬНО:
            1. В таблице цен укажи динамику (сравнение текущих цен с ценами начала прошлой недели).
            2. В блоке Regulatory опиши изменения, вступившие в силу или анонсированные за эти 7 дней.
            3. Соблюдай все разделы: Executive Summary, Market Analysis (по регионам), Table 1 (Prices), Table 3 (Regulatory), Conclusions.`
          }
        ],
        temperature: 0
      })
    });

    const data = await groqResponse.json();
    res.status(200).json({ report: data.choices?.[0]?.message?.content || "Ошибка генерации" });

  } catch (e) {
    res.status(200).json({ report: "## Ошибка\nПроблема с расчетом дат или API." });
  }
}
