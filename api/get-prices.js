export default async function handler(req, res) {
  const { type, timeframe = '1M' } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  // Динамическая дата для актуальности поиска
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Продвинутый поиск реальных данных
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `FCPO Bursa Malaysia daily prices history news Feb 2026 vegetable oil market updates`,
        search_depth: "advanced",
        max_results: 8,
        include_raw_content: false
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results.map(r => `SOURCE: ${r.title}\nCONTENT: ${r.content}`).join("\n\n");
    const sources = sData.results.map(r => ({ title: r.title, uri: r.url }));

    // 2. Формируем строгий промпт для Groq
    const systemRole = `You are a financial data analyst. Today is ${today}. 
    Your task is to extract REAL market data from the provided search context.
    STRICT RULES:
    1. DO NOT fabricate prices. Use the actual closing prices mentioned in the sources.
    2. If exact daily historical data is missing, find the LATEST price and adjust previous days ONLY based on mentioned percentage gains/losses.
    3. If no price is found, use a baseline of 3950 MYR (typical Feb 2026 level) and state it clearly.
    4. For News and Trade flows, use real names of countries (Russia, Kazakhstan, Uzbekistan, Ukraine, Malaysia) and real commodities.`;

    const userPrompt = `
    CONTEXT FROM WEB SEARCH:
    ${context}

    REQUEST:
    Return a JSON object with two main keys: "report" and "data".
    - "data": An array of at least 15 objects { "date": "ISO string", "open": num, "high": num, "low": num, "close": num } representing the FCPO price trend.
    - "report": Must include "summary", "topNews" (array), "priceTrends" (array), "regionalHighlights" (array), "tradeTable" (array), and "policyUpdates" (array).
    
    Ensure the JSON structure is perfectly valid and follows the schema strictly.`;

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
        temperature: 0.1 // Низкая температура снижает "фантазии"
      })
    });

    const gData = await groqRes.json();
    const finalResult = JSON.parse(gData.choices[0].message.content);

    // Добавляем источники в ответ
    return res.status(200).json({
      ...finalResult,
      sources: sources.slice(0, 3),
      isFallback: false
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch real-time data",
      details: error.message 
    });
  }
}
