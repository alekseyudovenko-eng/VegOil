export default async function handler(req, res) {
  const { type, timeframe } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  try {
    // 1. ПОИСК: Ищем свежие данные (работает из РФ, так как запрос идет с сервера Vercel)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Crude Palm Oil FCPO prices and vegetable oil market news Feb 2026`,
        search_depth: "advanced",
        days: 7
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results.map(r => r.content).join("\n\n");
    const sources = sData.results.map(r => ({ title: r.title, uri: r.url }));

    // 2. ОБРАБОТКА ДАННЫХ В ЗАВИСИМОСТИ ОТ ТИПА ЗАПРОСА
    let userPrompt = "";
    let systemRole = "";

    if (type === 'chart') {
      systemRole = "You are a data extraction tool. You do not analyze, you only extract numbers.";
      userPrompt = `
        CONTEXT: ${context}
        
        TASK: Extract ACTUAL price points for FCPO (Palm Oil). 
        - Look for strings like "4,150 MYR", "settled at...", "closed at...".
        - Assign dates mentioned in the text.
        - If the context doesn't have enough points for a full chart, provide ONLY what is found.
        - DO NOT INVENT DATA. If no prices are found, return an empty array.

        STRICT JSON FORMAT:
        {
          "data": [
            { "date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number }
          ]
        }
      `;
    } else {
      // type === 'report'
      systemRole = "You are a professional market intelligence analyst.";
      userPrompt = `
        CONTEXT: ${context}
        
        TASK: Create a comprehensive market report based on the context.
        Include Executive Summary, Top News, Policy Updates, and Trends.

        STRICT JSON FORMAT:
        {
          "report": {
            "summary": "...",
            "topNews": [{"commodity": "...", "headline": "...", "content": "..."}],
            "policyUpdates": [{"country": "...", "update": "..."}],
            "priceTrends": [{"commodity": "...", "trend": "up/down/stable", "details": "..."}],
            "tradeTable": [{"country": "...", "commodity": "...", "volumeType": "...", "volume": "...", "status": "..."}]
          }
        }
      `;
    }

    // 3. ЗАПРОС К GROQ
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemRole },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1 // Минимальная креативность для точности
      })
    });

    const gData = await groqRes.json();
    const result = JSON.parse(gData.choices[0].message.content);

    // 4. ОТВЕТ
    return res.status(200).json({
      ...result,
      sources: sources.slice(0, 3)
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
