export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // Расчет дат: строго (сегодня - 8) по (сегодня - 1)
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - 1);
  const start = new Date(today);
  start.setDate(today.getDate() - 8);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const period = `from ${startStr} to ${endStr}`;

  try {
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `palm oil FCPO prices news Malaysia Indonesia India ${period}`,
        search_depth: "advanced",
        max_results: 6,
        days: 7 // Встроенный фильтр Tavily на свежесть
      })
    });
    
    const sData = await search.json();
    const context = sData.results?.map(r => `[Source Date: ${r.published_date || 'Recent'}] ${r.content}`).join("\n\n");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a strict Commodity Analyst. Today is ${today.toISOString().split('T')[0]}.
            CRITICAL RULES:
            1. Report ONLY on events between ${startStr} and ${endStr}.
            2. DO NOT invent facts. 
            3. DO NOT use data older than ${startStr} (e.g., no 2021/2024 news).
            4. If no specific news for this exact week is found, state: "No major market developments reported for the specified period."
            5. Language: English.` 
          },
          { 
            role: "user", 
            content: `Analyze this context: ${context}. Create report: ## Executive Summary, ## Top News, ## Regulatory, ## Market Trend Analysis, ## Trade Flows.` 
          }
        ],
        temperature: 0.0 // Минимальный риск выдумок
      })
    });

    if (groqRes.status === 429) {
      return res.status(200).json({ report: "### API Limit\nPlease wait 60s for cool down." });
    }

    const gData = await groqRes.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `### Error\n${e.message}` });
  }
}
