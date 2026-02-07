export default async function handler(req, res) {
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const SERPER_KEY = process.env.SERPER_API_KEY;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10);
  const formatDate = (d) => d.toISOString().split('T')[0];
  const dateRange = `${formatDate(startDate)} to ${formatDate(endDate)}`;

  try {
    // ДЕЛАЕМ ПРИЦЕЛЬНЫЙ ПОИСК ПО БЛОКАМ (чтобы не пропустить мясо)
    const searchTasks = [
      // Блок 1: РФ и Украина (Пошлины, удары, экспорт)
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: TAVILY_KEY, 
          query: `Russia sunflower oil export duty February 2026, Ukraine port infrastructure damage oil terminals, FOB prices Black Sea`, 
          search_depth: "advanced" 
        })
      }).then(r => r.json()),

      // Блок 2: ЕС и Рапс (RED III, цены Euronext)
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `Euronext rapeseed prices February 2026 EU RED III standards impact`, gl: "us" })
      }).then(r => r.json()),

      // Блок 3: Центральная Азия (Казахстан, Узбекистан - законы, пошлины)
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `Казахстан пошлина подсолнечник Узбекистан импорт масла февраль 2026`, gl: "ru", hl: "ru" })
      }).then(r => r.json()),

      // Блок 4: Мировые рынки (Индия, Китай, Пальма, Нефть)
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: TAVILY_KEY, 
          query: `India sunflower oil import volume Feb 2026, BMD palm oil futures, Brent oil price dynamics`, 
          max_results: 5 
        })
      }).then(r => r.json())
    ];

    const results = await Promise.allSettled(searchTasks);
    let context = "";
    results.forEach(res => {
      if (res.status === 'fulfilled') context += JSON.stringify(res.value);
    });

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `Ты — эксперт-аналитик рынка масличных. Твой отчет должен быть МАКСИМАЛЬНО подробным. 
            Используй цифры, проценты, конкретные названия компаний и портов из контекста. 
            Если данных много — пиши развернуто по каждой стране. Не жалей текста.` 
          },
          { 
            role: "user", 
            content: `Контекст: ${context}. 
            Сформируй ГЛУБОКИЙ аналитический отчет за 10 дней (${dateRange}) для 27 стран (список в твоей памяти).
            
            СТРУКТУРА:
            # АНАЛИТИЧЕСКИЙ ОТЧЕТ ПО РЫНКУ РАСТИТЕЛЬНЫХ МАСЕЛ И ЖИРОВ
            (Подробная шапка)

            ## EXECUTIVE SUMMARY
            (Мировой рынок, Brent, SAF/HVO, макроэкономика)

            ## I. MARKET ANALYSIS BY KEY REGIONS
            - **Russia**: (Подробно: пошлина, FOB Новороссийск, темпы отгрузок, крупнейшие покупатели)
            - **Ukraine**: (Подробно: статус терминалов в портах Одесса/Черноморск, переработка, логистика)
            - **European Union**: (Рапсовое масло, биодизель, пошлины, цены FOB Six Ports)
            - **Central Asia & Caucasus**: (Регуляторика Казахстана, Узбекистана, Армении, Грузии - всё что найдешь)

            ## II. PRICE MONITORING (Table 1)
            (Таблица с динамикой. Минимум 6-8 строк с разными базисами)

            ## III. REGULATORY CHANGES (Table 3)
            (Таблица всех мер за 10 дней)

            ## IV. CONCLUSIONS (Развернутый прогноз)`
          }
        ],
        temperature: 0.2
      })
    });

    const data = await groqResponse.json();
    res.status(200).json({ report: data.choices?.[0]?.message?.content || "Ошибка данных" });

  } catch (e) {
    res.status(200).json({ report: `Ошибка: ${e.message}` });
  }
}
