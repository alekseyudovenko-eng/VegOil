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
        // FULL COMMODITY LIST IN QUERY
        query: `market prices and news for FCPO, palm oil, Sunflower oil, Rapeseed oil, Soybean oil, Cottonseed oil, Margarine, and Crude oil ${period}`,
        search_depth: "advanced",
        max_results: 15, 
        days: 7
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
          { 
            role: "system", 
            content: `You are a Senior Commodity Analyst. Today is ${today.toISOString().split('T')[0]}.
            STRICT FORMATTING RULES:
            1. Language: ENGLISH ONLY.
            2. NO numbering (1, 2, 3). NO symbols like '*' or '-' at the start of headers.
            3. Use '##' for main section headers.
            4. Use BOLD text for prices, percentages, and key market figures.
            5. Report ONLY on events from ${startStr} to ${endStr}.
            6. If no specific news is found for a commodity, state: "No significant developments for [Commodity] during this period."` 
          },
          { 
            role: "user", 
            content: `Context: ${context}. 
            Structure:
            ## Executive Summary
            ## Top News by Commodity (Sections for: FCPO, Palm Oil, Sunflower Oil, Rapeseed Oil, Soybean Oil, Cottonseed Oil, Margarine, Crude Oil)
            ## Regulatory & Policy Updates
            ## Market Trend Analysis
            ## Trade Flows & Production` 
          }
        ],
        temperature: 0.0
      })
    });

    if (groqRes.status === 429) {
      return res.status(200).json({ report: "### API Limit\nRate limit active. Please wait 60 seconds." });
    }

    const gData = await groqRes.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `### Error\n${e.message}` });
  }
}
