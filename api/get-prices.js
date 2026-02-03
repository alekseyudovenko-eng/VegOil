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
    // 1. ПОИСК (Запрос сфокусирован на 2026 годе)
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `latest market prices news FCPO palm oil Sunflower Rapeseed Soybean Cottonseed oil Margarine Crude oil Jan Feb 2026`,
        search_depth: "advanced",
        max_results: 8,
        days: 7
      })
    });
    
    const sData = await search.json();
    const context = sData.results?.map(r => r.content).join("\n\n") || "No data found.";

    // 2. ГЕНЕРАЦИЯ (Сбалансированный фильтр)
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodity Analyst. 
            Target Period: ${startStr} to ${endStr} (Early February 2026).
            
            GUIDELINES:
            1. Use the provided context to build a report for the CURRENT week. 
            2. Prioritize recent information from late January and February 2026.
            3. Discard any information explicitly dated 2024 or 2025.
            4. Keep it professional. English only. No numbering. No asterisks (*). Use ## for headers.` 
          },
          { 
            role: "user", 
            content: `Context: ${context}. 
            Create the report for ${period} with these exact headers:
            ## Executive Summary
            ## Top News by Commodity
            ## Regulatory & Policy Updates
            ## Market Trend Analysis
            ## Trade Flows & Production` 
          }
        ],
        temperature: 0.1
      })
    });

    const gData = await groqRes.json();

    if (gData.choices && gData.choices[0]) {
      res.status(200).json({ report: gData.choices[0].message.content });
    } else {
      const errorMsg = gData.error?.message || "API Error";
      res.status(200).json({ report: `## Technical Notice\nGroq limit: ${errorMsg}` });
    }

  } catch (e) {
    res.status(200).json({ report: `## Error\n${e.message}` });
  }
}
