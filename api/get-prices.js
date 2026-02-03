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
    // 1. ПОИСК (Улучшенный запрос для точности)
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

    // 2. ГЕНЕРАЦИЯ С ЖЕСТКИМ ФИЛЬТРОМ ДАТ
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a strict data validation engine. 
            CURRENT DATE: ${today.toISOString().split('T')[0]}.
            TARGET WINDOW: Strictly from ${startStr} to ${endStr}.

            MANDATORY PROTOCOL:
            1. Analyze the publication date of every piece of information.
            2. If it's dated before ${startStr} or after ${endStr} (e.g. Nov 2025), IGNORE IT.
            3. Do not report old news. If no fresh data is found, state: "No significant updates in this window."
            4. Language: English. No numbering. No bold symbols (*). Use ## for headers.` 
          },
          { 
            role: "user", 
            content: `Context: ${context}. 
            Create a report for ${period} using exactly these headers:
            ## Executive Summary
            ## Top News by Commodity
            ## Regulatory & Policy Updates
            ## Market Trend Analysis
            ## Trade Flows & Production` 
          }
        ],
        temperature: 0.0
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
