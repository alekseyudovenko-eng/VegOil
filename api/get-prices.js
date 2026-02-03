export default async function handler(req, res) {
  const { type } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // ТВОИ САЙТЫ (теперь Tavily будет искать только здесь)
  const myTargetSites = [
    "marketscreener.com",
    "brecorder.com",
    "bernama.com",
    "agropost.wordpress.com"
  ];

  try {
    // 1. Поиск данных строго по твоим ссылкам
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Crude Palm Oil FCPO price quotes and market news",
        search_depth: "advanced",
        include_domains: myTargetSites, // Ограничиваем поиск твоими сайтами
        max_results: 6
      })
    });

    const sData = await searchRes.json();
    
    // Собираем весь текст с твоих сайтов в одну кучу для анализа
    const context = sData.results?.map(r => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n") || "";

    // 2. Отправляем этот текст в Groq, чтобы он вытянул цифры
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a palm oil market expert. Extract data into JSON. ONLY use the provided context." 
          },
          { 
            role: "user", 
            content: `Use this context from Marketscreener, Brecorder, etc: 
            ${context}
            
            Task: Find the LATEST FCPO (Crude Palm Oil) prices. 
            If you find specific quotes (Open, High, Low, Close), use them. 
            If you only find one price (e.g., '4150 MYR'), use it as the 'close' price for today.
            
            Return JSON format: {"data": [{"date": "2026-02-03", "open": 4150, "high": 4200, "low": 4120, "close": 4180}]}` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const gData = await groqRes.json();
    const content = JSON.parse(gData.choices[0].message.content);

    // 3. Отдаем результат фронтенду
    return res.status(200).json({
      data: content.data || [],
      report: content.report || content,
      sources: sData.results || [] // Список ссылок, чтобы ты видел, откуда взяты данные
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(200).json({ error: error.message, data: [] });
  }
}
