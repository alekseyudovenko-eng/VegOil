export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - 1);
  const start = new Date(today);
  start.setDate(today.getDate() - 8);
  const dateRange = `from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

  try {
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `palm oil FCPO prices news ${dateRange} Malaysia Indonesia India`,
        search_depth: "advanced",
        max_results: 5 // Уменьшил количество, чтобы Groq было легче обработать
      })
    });
    
    const sData = await search.json();
    const context = sData.results?.map(r => r.content).join("\n\n");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: `Analyst. Date: Feb 3, 2026. Period: ${dateRange}. English only.` },
          { role: "user", content: `Context: ${context}. Create report with sections: ## Executive Summary, ## Top News, ## Regulatory, ## Market Trend Analysis, ## Trade Flows.` }
        ],
        temperature: 0.1
      })
    });

    if (groqRes.status === 429) {
      return res.status(200).json({ report: "### Groq API Limit Reached\n\n**Action required:** Please wait exactly 60 seconds without refreshing the page. The free plan allows limited requests per minute." });
    }

    const gData = await groqRes.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `### Connection Error\n${e.message}` });
  }
}
