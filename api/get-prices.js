export default async function handler(req, res) {
  const { region, topic } = req.query;
  
  const SERPER_KEY = process.env.SERPER_API_KEY || process.env.VITE_SERPER_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!SERPER_KEY || !GROQ_KEY) return res.status(200).json({ report: "### Config Error: Ключи не найдены." });

  const queryTemplates = {
    news: `latest market news "vegetable oil" OR "margarine" OR "fats"`,
    trade: `export import supply demand statistics "sunflower oil" OR "palm oil"`,
    policy: `regulations export duty taxes "vegetable oils" OR "fats"`,
    prices: `current market price quotes USD "sunflower oil" OR "palm oil" OR "CBE" OR "CBS"`
  };

  const fullQuery = `${queryTemplates[topic] || queryTemplates.news} in ${region} February 2026`;

  try {
    // 1. Поиск в Google (Serper)
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        q: fullQuery, 
        num: 40, 
        tbs: "qdr:m" // Глубина поиска — 1 месяц
      })
    });
    
    const searchData = await serperRes.json();
    const snippets = (searchData.organic || []).map(o => `${o.title}: ${o.snippet}`).join("\n\n");

    // 2. Генерация отчета (Groq)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodities Analyst. Focus: ${region}, Topic: ${topic}. 
            Your goal: provide a structured market update. 
            1. Use "LATEST" for Feb 2026 facts. 
            2. Summarize general environment if specific news is sparse. 
            3. Use Markdown: ## for headers and TABLES for data. 
            4. Focus on vegetable oils/fats only.` 
          },
          { role: "user", content: `Search results: \n\n${snippets}` }
        ],
        temperature: 0.1
      })
    });

    const aiData = await groqRes.json();
    
    if (!aiData.choices) throw new Error("Groq API error");
    
    res.status(200).json({ report: aiData.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
