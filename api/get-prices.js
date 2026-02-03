export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!TAVILY_KEY || !GROQ_KEY) {
    return res.status(200).json({ 
      report: `### Configuration Error\nAPI Keys missing.` 
    });
  }

  try {
    // ШАГ 1: Поиск СТРОГО по тикеру FCPO и только за последние 7 дней
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Жесткий запрос: тикер + временной интервал
        query: "palm oil fcpo prices and market news last 7 days", 
        search_depth: "advanced",
        max_results: 8
      })
    });

    if (search.status === 429) throw new Error("Tavily Rate Limit");
    const sData = await search.json();
    
    // Собираем найденный контент
    const context = sData.results?.map(r => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

    // ШАГ 2: Генерация отчета на базе найденных данных
    const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [{ 
          role: "system", 
          content: "You are a Senior Commodity Analyst. You must generate a report based ONLY on the provided news for the LAST 7 DAYS. Use professional English." 
        }, {
          role: "user",
          content: `Data from the last 7 days: ${context}. 

          Generate the 'Market Intelligence Report: Vegetable Oils & Fats' using this exact structure:
          ## Executive Summary
          ## Top News by Commodity (Focus on Palm Oil FCPO, then Sun/Rape/Soy/Margarine/Crude based on news)
          ## Regulatory & Policy Updates
          ## Market Trend Analysis
          ## Trade Flows & Production`
        }],
        temperature: 0.1
      })
    });

    if (groq.status === 429) throw new Error("Groq Rate Limit. Wait 1 min.");
    const gData = await groq.json();

    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `### API Error\n${e.message}` });
  }
}
