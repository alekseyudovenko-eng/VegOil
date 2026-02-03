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
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `prices news FCPO palm oil Sunflower Rapeseed Soybean Cottonseed oil Margarine Crude oil ${period}`,
        search_depth: "advanced",
        max_results: 8, // Снизил с 15 до 8, чтобы не вылетать за лимит 6000 токенов
        days: 7
      })
    });
    
    const sData = await search.json();
    const context = sData.results?.map(r => r.content).join("\n\n") || "No news found.";

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `Senior Analyst. Period: ${period}. English only. No numbering. Use ## for headers. Bold key figures.` 
          },
          { 
            role: "user", 
            content: `Context: ${context}. Structure: ## Executive Summary, ## Top News by Commodity (FCPO, Palm Oil, Sunflower Oil, Rapeseed Oil, Soybean Oil, Cottonseed Oil, Margarine, Crude Oil), ## Regulatory & Policy Updates, ## Market Trend Analysis, ## Trade Flows & Production.` 
          }
        ],
        temperature: 0.0
      })
    });

    const gData = await groqRes.json();

    // FAILSAFE: Check if gData has the expected structure
    if (gData && gData.choices && gData.choices[0] && gData.choices[0].message) {
      res.status(200).json({ report: gData.choices[0].message.content });
    } else {
      // If Groq returns an error object instead of a choice
      const errorMsg = gData.error?.message || "Unknown API Error";
      res.status(200).json({ report: `### Technical Notice\n\nGroq API is currently busy: **${errorMsg}**. \n\nPlease wait 60 seconds and refresh.` });
    }

  } catch (e) {
    res.status(200).json({ report: `### Connection Error\n${e.message}` });
  }
}
