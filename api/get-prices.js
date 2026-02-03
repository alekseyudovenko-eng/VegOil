export default async function handler(req, res) {
  // Пытаемся достать ключи во всех возможных именованиях
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  // Если ключей нет вообще
  if (!TAVILY_KEY || !GROQ_KEY) {
    return res.status(200).json({ 
      report: `### Ошибка конфигурации
Ключи не найдены в системе. 
Tavily: ${TAVILY_KEY ? 'OK' : 'MISSING'}
Groq: ${GROQ_KEY ? 'OK' : 'MISSING'}` 
    });
  }

  try {
    // 1. Тестируем Tavily
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "palm oil fcpo price news last 7 days feb 2026",
        max_results: 5
      })
    });

    if (search.status === 429) throw new Error("Tavily API: Превышен лимит (Rate Limit)");
    if (!search.ok) throw new Error(`Tavily API Error: ${search.status}`);

    const sData = await search.json();
    const context = sData.results?.map(r => r.content).join("\n");

    // 2. Тестируем Groq
    const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ 
          role: "user", 
          content: `Составь краткий Market Intelligence Report на основе: ${context}` 
        }]
      })
    });

    if (groq.status === 429) throw new Error("Groq API: Превышен лимит (Rate Limit)");
    if (!groq.ok) throw new Error(`Groq API Error: ${groq.status}`);

    const gData = await groq.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    // Выводим конкретную ошибку (лимит или просрочка) прямо в интерфейс
    res.status(200).json({ report: `### Ошибка API\n${e.message}` });
  }
}
