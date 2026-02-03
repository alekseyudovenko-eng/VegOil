export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // Вычисляем даты для строгого фильтра
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - 1); // Вчера
  const start = new Date(today);
  start.setDate(today.getDate() - 8); // 8 дней назад

  const dateRangeStr = `from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

  try {
    // 1. Поиск с динамическими датами
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `palm oil FCPO prices news ${dateRangeStr} Malaysia Indonesia India`,
        search_depth: "advanced",
        max_results: 10,
        days: 7 // Фильтр самой системы Tavily
      })
    });
    
    const sData = await search.json();
    const context = sData.results?.map(r => `[${r.url}] ${r.content}`).join("\n\n");

    // 2. Генерация отчета (с жесткой инструкцией по датам)
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodity Analyst. Today is ${today.toISOString().split('T')[0]}. 
            Your task: Generate a Market Intelligence Report STRICTLY for the period: ${dateRangeStr}.
            IGNORE any news from 2021, 2024, or lockdowns. If no data for this week is found, state that.
            Use professional English.` 
          },
          { 
            role: "user", 
            content: `Context: ${context}. 
            Format:
            ## Executive Summary (Focus on FCPO at RM 4200+ and India's 51% surge)
            ## Top News by Commodity
            ## Regulatory & Policy (Focus on Indonesia's export ban on waste oil from Feb 2)
            ## Market Trend Analysis
            ## Trade Flows & Production` 
          }
        ],
        temperature: 0.1
      })
    });

    if (groqRes.status === 429) return res.status(200).json({ report: "### API Limit\nRate limit reached. Please wait 30s." });

    const gData = await groqRes.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `### Error\n${e.message}` });
  }
}
