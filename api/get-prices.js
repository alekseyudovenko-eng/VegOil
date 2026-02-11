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
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: TAVILY_KEY, 
          query: `Sunflower, Rapeseed, Palm oil prices and Brent crude oil news ${dateRange} Russia, Ukraine, EU`, 
          search_depth: "advanced" 
        })
      }).then(async r => {
        if (!r.ok) return { error: `Tavily error: ${r.status} ${await r.text()}` };
        return r.json();
      }),

      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: `рынок промышленных маргаринов и спецжиров ЗМЖ кондитерские жиры пошлины новости ${dateRange} РФ Казахстан Узбекистан`, 
          gl: "ru" 
        })
      }).then(async r => {
        if (!r.ok) return { error: `Serper error: ${r.status} ${await r.text()}` };
        return r.json();
      })
    ];

    const results = await Promise.allSettled(searchTasks);
    let context = "";
    results.forEach(res => {
      if (res.status === 'fulfilled') {
        if (res.value.error) context += `\n[SEARCH ERROR]: ${res.value.error}`;
        else context += JSON.stringify(res.value);
      }
    });

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `Ты — эксперт-аналитик Agro-Oil. Отчет за ${dateRange}. 27 стран (от Azerbaijan до Uzbekistan). Продукты: масла, нефть, маргарины, спецжиры.` 
          },
          { 
            role: "user", 
            content: `Контекст данных: ${context}. Сформируй детальный отчет.`
          }
        ],
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();

    // ПОДРОБНАЯ ПРОВЕРКА ОТВЕТА GROQ
    if (data.error) {
      return res.status(200).json({ 
        report: `## ОШИБКА GROQ API\n**Тип:** ${data.error.type}\n**Сообщение:** ${data.error.message}\n**Код:** ${data.error.code}` 
      });
    }

    if (!data.choices || data.choices.length === 0) {
      return res.status(200).json({ 
        report: `## ОШИБКА ФОРМАТА\nGroq вернул пустой результат. Полный ответ: ${JSON.stringify(data)}` 
      });
    }

    res.status(200).json({ report: data.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ 
      report: `## КРИТИЧЕСКАЯ СИСТЕМНАЯ ОШИБКА\n**Текст:** ${e.message}\n**Стек:** ${e.stack}` 
    });
  }
}
