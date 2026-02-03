export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - 1);
  const start = new Date(today);
  start.setDate(today.getDate() - 8);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const period = `from ${startStr} to ${endStr}`;

  try {
    // 1. ПОИСК ПО ВСЕМ ТВОИМ ПРОДУКТАМ
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `market prices news FCPO, palm oil, Sunflower oil, Rapeseed oil, Soybean oil, Cottonseed oil, Margarine, Crude oil ${period}`,
        search_depth: "advanced",
        max_results: 10,
        days: 7
      })
    });
    
    const sData = await search.json();
    const context = sData.results?.map(r => r.content).join("\n\n") || "No data found.";

    // 2. ГЕНЕРАЦИЯ ТЕКСТОВОГО ОТЧЕТА (БЕЗ JSON-РЕЖИМА)
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodity Analyst. Today is ${today.toISOString().split('T')[0]}.
            STRICT RULES:
            1. Language: English only.
            2. Sections: Use ## for each header. 
            3. Headers to use: ## Executive Summary, ## Top News by Commodity, ## Regulatory & Policy Updates, ## Market Trend Analysis, ## Trade Flows & Production.
            4. In 'Top News by Commodity', cover: FCPO, Palm Oil, Sunflower Oil, Rapeseed Oil, Soybean Oil, Cottonseed Oil, Margarine, Crude Oil.
            5. No numbering. No bold symbols like **. 
            6. Report only from ${startStr} to ${endStr}.` 
          },
          { 
            role: "user", 
            content: `Analyze this: ${context}. Produce the report.` 
          }
        ],
        temperature: 0.0
      })
    });

    const gData = await groqRes.json();

    if (gData.choices && gData.choices[0]) {
      // Отдаем как report, который App.tsx распарсит по ##
      res.status(200).json({ report: gData.choices[0].message.content });
    } else {
      const errorMsg = gData.error?.message || "API Error";
      res.status(200).json({ report: `## Technical Notice\nGroq is busy: ${errorMsg}. Please wait 60s.` });
    }

  } catch (e) {
    res.status(200).json({ report: `## Error\n${e.message}` });
  }
}
