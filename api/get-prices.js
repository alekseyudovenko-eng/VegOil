export default async function handler(req, res) {
  // Ставим заголовки сразу, чтобы Vercel не тупил
  res.setHeader('Content-Type', 'application/json');
  
  const { type } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    if (!TAVILY_KEY || !GROQ_KEY) {
      return res.status(200).json({ error: "Missing Keys", data: [] });
    }

    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "FCPO palm oil prices news Feb 2026",
        search_depth: "basic"
      })
    });

    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n") || "";

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return ONLY JSON." },
          { role: "user", content: `Context: ${context}. If type is chart, return {"data": [...]}. If report, return {"report": {...}}. Type: ${type}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const gData = await groqRes.json();
    const result = JSON.parse(gData.choices[0].message.content);

    return res.status(200).json({ ...result, sources: sData.results || [] });
  } catch (err) {
    return res.status(200).json({ error: err.message, data: [] });
  }
}
