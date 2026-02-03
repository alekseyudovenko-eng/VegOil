export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (!TAVILY_KEY || !GROQ_KEY) {
    return res.status(200).json({ report: "# Ошибка\nНе настроены ключи API в Vercel." });
  }

  try {
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "palm oil fcpo news last 7 days",
        max_results: 5
      })
    });
    const sData = await search.json();
    const context = sData.results?.map(r => r.content).join("\n");

    const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: `Напиши Market Intelligence Report (Vegetable Oils & Fats) на основе: ${context}. Используй разделы: Executive Summary, Top News by Commodity, Regulatory, Trend Analysis, Trade Flows.` }]
      })
    });
    const gData = await groq.json();

    res.status(200).json({ report: gData.choices[0].message.content });
  } catch (e) {
    res.status(200).json({ report: "# Ошибка запроса\n" + e.message });
  }
}
