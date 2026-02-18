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

  const fullQuery = `${queryTemplates[topic] || queryTemplates.news} ${region} -petroleum -fuel`;

  try {
    // 1. Поиск в Google (Serper)
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        q: fullQuery, 
        num: 40, 
        tbs: "qdr:m" 
      })
    });
    
    const searchData = await serperRes.json();
    
    // Объявляем snippets через let ОДИН раз
    let snippets = (searchData.organic || [])
      .map(o => `${o.title}: ${o.snippet}`)
      .join("\n\n");
    
    // Проверка на пустоту (План Б)
    if (!snippets || snippets.length < 20) {
      snippets = `Notice: No direct news found for ${region} on topic ${topic} in the last 30 days. 
      Please provide a strategic analysis and typical market conditions for this area. 
      Include information about vegetable oil prices and trade logistics if possible.`;
    }

    // 2. Генерация отчета (Groq)
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
            content: `You are a Market Intelligence Bot. 
            Focus: ${region}, Topic: ${topic}.
            If there are no "breaking news", summarize the TRENDS from the last 30 days.
            - Mention price levels if found.
            - Mention logistics (Middle Corridor, Black Sea).
            - Format: Professional Markdown, use ## for headers and tables for data.
            NEVER return an empty report.` 
          },
          { role: "user", content: `Search results: \n\n${snippets}` }
        ],
        temperature: 0.1
      })
    });

    const aiData = await groqRes.json();
    
    if (!aiData.choices || aiData.choices.length === 0) {
      throw new Error("Groq API returned no results.");
    }
    
    res.status(200).json({ report: aiData.choices[0].message.content });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
