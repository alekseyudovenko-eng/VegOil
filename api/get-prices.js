export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const SERPER_KEY = process.env.SERPER_API_KEY;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10);

  const formatDate = (d) => d.toISOString().split('T')[0];
  const dateFrom = formatDate(startDate);
  const dateTo = formatDate(endDate);

  try {
    const searchQuery = `vegetable oil prices news from ${dateFrom} to ${dateTo} Russia, Ukraine, Kazakhstan, Belarus, Uzbekistan, EU`;

    // Запускаем поиск
    const searchResults = await Promise.allSettled([
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TAVILY_KEY, query: searchQuery, max_results: 10 })
      }).then(r => r.json()),
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `цена масло пошлина РФ Украина ${dateFrom} ${dateTo}`, gl: "ru" })
      }).then(r => r.json())
    ]);

    let context = "";
    searchResults.forEach(res => {
      if (res.status === 'fulfilled') context += JSON.stringify(res.value);
    });

    // Генерируем отчет
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `Ты — аналитик. Твой отчет за период ${dateFrom} — ${dateTo}. 
            СТРАНЫ: Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan.
            Язык: РУССКИЙ.` 
          },
          { 
            role: "user", 
            content: `Контекст: ${context}. 
            Сформируй отчет строго по структуре: 
            # АНАЛИТИЧЕСКИЙ ОТЧЕТ ПО РЫНКУ РАСТИТЕЛЬНЫХ МАСЕЛ И ЖИРОВ
            Период: ${dateFrom} — ${dateTo}
            Список стран: (все 27 стран)
            ## EXECUTIVE SUMMARY
            ## I. MARKET ANALYSIS BY KEY REGIONS
            (Russia, Ukraine, EU, Central Asia)
            ## II. PRICE MONITORING (Table 1)
            (Продукт, Базис, Цена, Динамика)
            ## III. REGULATORY CHANGES (Table 3)
            ## IV. CONCLUSIONS`
          }
        ],
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();

    // Если Groq вернул ошибку в самом JSON (например, превышение лимитов)
    if (data.error) {
      return res.status(200).json({ report: `## Ошибка API Groq: ${data.error.message}` });
    }

    const reportContent = data.choices?.[0]?.message?.content || "Не удалось сформировать текст отчета.";
    res.status(200).json({ report: reportContent });

  } catch (e) {
    // Выводим реальную ошибку в лог и на экран
    console.error("CRITICAL ERROR:", e);
    res.status(200).json({ report: `## Системная ошибка\n${e.message}` });
  }
}
