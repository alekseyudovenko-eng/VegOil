export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const SERPER_KEY = process.env.SERPER_API_KEY;

  // 1. ДИНАМИЧЕСКИЙ РАСЧЕТ ДЕСЯТИДНЕВКИ (ОКНО ПОИСКА)
  const endDate = new Date(); // Текущая дата (сегодня)
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10); // Начало периода (10 дней назад)

  const formatDate = (d) => d.toISOString().split('T')[0];
  const dateFrom = formatDate(startDate);
  const dateTo = formatDate(endDate);

  try {
    // 2. ФОРМИРОВАНИЕ ЗАПРОСА ДЛЯ ПОИСКОВИКОВ
    // Ищем новости и цены строго за этот интервал по ключевым регионам
    const searchQuery = `vegetable oil prices market news from ${dateFrom} to ${dateTo} Russia, Ukraine, Kazakhstan, Belarus, Uzbekistan, EU ports`;

    const searchResults = await Promise.allSettled([
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: TAVILY_KEY, 
          query: searchQuery,
          search_depth: "advanced",
          max_results: 12
        })
      }).then(r => r.json()),
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: `цена подсолнечное масло экспортная пошлина РФ Украина Казахстан изменения ${dateFrom} ${dateTo}`, 
          gl: "ru",
          hl: "ru"
        })
      }).then(r => r.json())
    ]);

    let context = "";
    if (searchResults[0].status === 'fulfilled') context += JSON.stringify(searchResults[0].value);
    if (searchResults[1].status === 'fulfilled') context += JSON.stringify(searchResults[1].value);

    // 3. ОТПРАВКА ДАННЫХ В GROQ ДЛЯ ГЕНЕРАЦИИ ПО ОБРАЗЦУ
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
            content: `Ты — ведущий аналитик Agro-Oil. Твоя задача подготовить отчет строго за период с ${dateFrom} по ${dateTo}.
            СПИСОК СТРАН: Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan.
            Язык отчета: РУССКИЙ. Используй профессиональную терминологию (FOB, CIF, МЭЗ, RED III).` 
          },
          { 
            role: "user", 
            content: `Данные мониторинга: ${context}
            
            СФОРМИРУЙ ОТЧЕТ СТРОГО ПО ЭТОЙ СТРУКТУРЕ:
            
            # АНАЛИТИЧЕСКИЙ ОТЧЕТ ПО РЫНКУ РАСТИТЕЛЬНЫХ МАСЕЛ И ЖИРОВ
            Период мониторинга: ${dateFrom} — ${dateTo}
            Страны отчета: (выведи здесь весь список из 27 стран через запятую)

            ## EXECUTIVE SUMMARY
            (Обзор мирового рынка, капитализация, Brent, тренды биоэкономики HVO/SAF за эти 10 дней)

            ## I. MARKET ANALYSIS BY KEY REGIONS
            - **Russia**: (Экспорт, цены FOB, пошлины, данные по Индии/Китаю/Турции/Египту)
            - **Ukraine**: (Удары по инфраструктуре, логистика, порты)
            - **European Union**: (Рапс, биотопливо, RED III)
            - **Central Asia & Caucasus**: (Казахстан и Узбекистан - регуляторика, пошлины, коды НКТ)

            ## II. PRICE MONITORING (Table 1)
            (Создай таблицу: Продукт | Базис/Рынок | Цена | Динамика 📈/📉. Включи масло РФ, ЕС, рапс, пальму и нефть Brent)

            ## III. REGULATORY CHANGES (Table 3)
            (Создай таблицу: Страна/Регион | Мера | Срок | Влияние. Включи пошлины и квоты, изменившиеся за 10 дней)

            ## IV. CONCLUSIONS
            (Краткие выводы по дефициту и прогнозу цен)`
          }
        ],
        temperature: 0.2 // Небольшая вариативность для естественности текста, но строгость в фактах
      })
    });

    const data = await groqResponse.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Groq API returned empty response");
    }

    res.status(200).json({ report: data.choices[0].message.content });

  } catch (e) {
    console.error("Error generating report:", e);
    res.status(500).json({ 
      report: "## Ошибка генерации\nНе удалось собрать данные за период " + dateFrom + " - " + dateTo + ". Проверьте ключи API или подключение." 
    });
  }
}
