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
    const searchTasks = [
      // Блок 1: Сырые масла и Нефть (Базис)
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: TAVILY_KEY, 
          query: `Sunflower, Rapeseed, Palm oil prices and Brent crude oil news ${dateRange} Russia, Ukraine, EU`, 
          search_depth: "advanced" 
        })
      }).then(r => r.json()),

      // Блок 2: Маргарины и Спецжиры (Твоя специфика)
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: `рынок промышленных маргаринов и спецжиров ЗМЖ кондитерские жиры пошлины новости ${dateRange} РФ Казахстан Узбекистан`, 
          gl: "ru" 
        })
      }).then(r => r.json()),

      // Блок 3: Регуляторика СНГ и Европы
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: `export duties and trade regulations vegetable oils Feb 2026 Russia Ukraine Kazakhstan EU`, 
          gl: "us" 
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
            content: `Ты — эксперт-аналитик Agro-Oil. Твоя задача — составить подробный отчет за 10 дней (${dateRange}).
            СПИСОК СТРАН: Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan.
            ПРОДУКТЫ: Растительные масла (подсолнечное, рапсовое, соевое, пальмовое), Нефть Brent, Маргариновая продукция, Жиры специального назначения (ЗМЖ, кондитерские жиры).` 
          },
          { 
            role: "user", 
            content: `Контекст: ${context}. 
            Сформируй отчет:
            1. Заголовок с периодом и списком всех 27 стран.
            2. Анализ по регионам (Россия, Украина, ЕС, Центральная Азия/Кавказ).
            3. Цены и динамика по ВСЕМ продуктам (включая спецжиры и маргарины).
            4. Изменения в пошлинах и законах.
            5. Выводы.`
          }
        ],
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();
    res.status(200).json({ report: data.choices?.[0]?.message?.content || "Ошибка генерации текста" });

  } catch (e) {
    res.status(200).json({ report: `Системная ошибка: ${e.message}` });
  }
}
