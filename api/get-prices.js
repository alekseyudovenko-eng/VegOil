export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const SERPER_KEY = process.env.SERPER_API_KEY;

  const queryEn = "sunflower oil prices FOB Black Sea, Russian export duties February 2026, Brent oil price";
  const queryRu = "цены на подсолнечное масло фоб черное море, экспортная пошлина рф февраль 2026";

  try {
    // Параллельный запрос к оставшимся трем источникам
    const searchResults = await Promise.allSettled([
      // 1. Tavily (Глобальная аналитика)
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TAVILY_KEY, query: queryEn, search_depth: "advanced" })
      }).then(r => r.json()),

      // 2. Serper (Специфика РФ и новости через Yandex/Google)
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: queryRu, gl: "ru", hl: "ru" })
      }).then(r => r.json()),

      // 3. DuckDuckGo (Быстрый справочный слой)
      fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(queryEn)}&format=json`).then(r => r.json())
    ]);

    let context = "";
    
    // Собираем данные Tavily
    if (searchResults[0].status === 'fulfilled') {
      context += "TAVILY DATA:\n" + searchResults[0].value.results?.map(r => r.content).join("\n") + "\n\n";
    }
    // Собираем данные Serper
    if (searchResults[1].status === 'fulfilled') {
      context += "REGIONAL DATA:\n" + searchResults[1].value.organic?.map(r => r.snippet).join("\n") + "\n\n";
    }
    // Собираем данные DuckDuckGo
    if (searchResults[2].status === 'fulfilled' && searchResults[2].value.AbstractText) {
      context += "QUICK FACTS:\n" + searchResults[2].value.AbstractText + "\n\n";
    }

    // Финальный промпт для Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `
            ТЫ — ВЕДУЩИЙ ЭКСПЕРТ AGRO-OIL MONITOR.
            Используй следующие оперативные данные из интернета:
            ---
            ${context}
            ---
            ЗАДАНИЕ:
            Создай профессиональный рыночный отчет на РУССКОМ языке. Сегодня 7 февраля 2026 года.
            
            ТРЕБОВАНИЯ К ОТЧЕТУ:
            - Заголовок с датой.
            - Секция "Мировые тренды": что с ценами на масло и нефть Brent.
            - Таблица цен (FOB/CIF).
            - Секция "Регулирование в РФ": пошлины на масло и шрот.
            - Краткий прогноз на неделю.
            
            Стиль: Строгий, аналитический. Если цифры в источниках разнятся, укажи диапазон.
          ` }] 
        }]
      })
    });

    const finalData = await geminiResponse.json();
    const report = finalData.candidates?.[0]?.content?.parts?.[0]?.text;

    res.status(200).json({ report: report || "Ошибка синтеза отчета." });

  } catch (e) {
    res.status(200).json({ report: "Ошибка системы поиска. Проверь ключи API в Vercel." });
  }
}
