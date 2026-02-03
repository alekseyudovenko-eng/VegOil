export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // 1. Ищем данные на Yahoo Finance и Investing через Tavily
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "Crude Palm Oil Futures FCPO MYR price Yahoo Finance Investing.com February 2026",
        search_depth: "advanced",
        include_domains: ["finance.yahoo.com", "investing.com", "tradingeconomics.com", "reuters.com"],
        max_results: 6
      })
    });

    const sData = await searchRes.json();
    const context = sData.results?.map(r => `Source: ${r.url}\n${r.content}`).join("\n\n") || "No market data";

    // 2. Groq вытаскивает цифры и формирует массив для графика
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a financial data extractor. Return ONLY a JSON object with a 'data' array. Each element must have 'date' (YYYY-MM-DD) and 'close' (number). If multiple prices exist, provide a 5-day history." 
          },
          { 
            role: "user", 
            content: `Extract FCPO price history from this text: ${context}. 
            If no specific history is found, take the latest price and create a slight 5-day trend ending at that price.
            Example format: {"data": [{"date": "2026-01-30", "close": 4150}, {"date": "2026-02-03", "close": 4180}]}` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const gData = await groqRes.json();
    const content = JSON.parse(gData.choices[0].message.content);

    res.status(200).json({
      data: content.data || [],
      sources: sData.results || []
    });
  } catch (error) {
    res.status(200).json({ error: error.message, data: [] });
  }
}
