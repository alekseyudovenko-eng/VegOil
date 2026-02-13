export default async function handler(req, res) {
  const { category } = req.query;
  const SERPER_KEY = process.env.SERPER_API_KEY; // Ключ от serper.dev
  const GROQ_KEY = process.env.GROQ_API_KEY;     // Ключ от Groq

  if (!SERPER_KEY || !GROQ_KEY) {
    return res.status(200).json({ report: "### Ошибка: Не настроены ключи SERPER_API_KEY или GROQ_API_KEY" });
  }

  const configs = {
    news: {
      query: "новости рынок подсолнечное масло февраль 2026",
      system: "ТЫ — АНАЛИТИК. Собери только свежие новости. Игнорируй мусор."
    },
    prices: {
      query: "цена подсолнечное масло FOB, MATIF rapeseed, Brent oil, курсы валют USD RUB UZS KZT февраль 2026",
      system: "ТЫ — ЭКСПЕРТ. Найди цены и курсы. Сформируй таблицы. Укажи даты."
    }
    // ... остальные категории по аналогии
  };

  const current = configs[category] || configs.news;

  try {
    // 1. ЗАПРОС К SERPER (Эмуляция поиска Google)
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: current.query,
        gl: "ru", // Ищем по России/СНГ
        hl: "ru", // Результаты на русском
        num: 10   // Берем топ-10 результатов
      })
    });

    const searchData = await serperRes.json();

    // Собираем полезную инфу из выдачи Google
    const snippets = [
      ...(searchData.answerBox ? [JSON.stringify(searchData.answerBox)] : []),
      ...(searchData.organic || []).map(res => `${res.title}: ${res.snippet}`)
    ].join("\n\n");

    if (!snippets) {
      return res.status(200).json({ report: "### Google ничего не нашел по этому запросу." });
    }

    // 2. ОТПРАВКА В GROQ (или DeepSeek)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `${current.system} Пиши на русском. Используй Markdown. 
            Основывайся ТОЛЬКО на предоставленных данных поиска. 
            Если видишь противоречия в ценах — укажи оба источника.` 
          },
          { role: "user", content: `Данные из Google: \n${snippets}` }
        ],
        temperature: 0.1
      })
    });

    const aiData = await groqRes.json();
    res.status(200).json({ report: aiData.choices[0].message.content });

  } catch (error) {
    console.error("SERPER ERROR:", error);
    res.status(200).json({ report: `### Ошибка: ${error.message}` });
  }
}
