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

  try {
    // 1. ЗАПРОС ЦЕНЫ С MPOC (Твой новый блок)
    const mpocRes = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        urls: ["https://mpoc.org.my/"],
      })
    });
    const extraction = await mpocRes.json();
    const priceInfo = extraction.results?.[0]?.raw_content || "No MPOC data";

    // 2. ПОИСК НОВОСТЕЙ
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `latest prices news Feb 2026 palm oil Sunflower Rapeseed Soybean Cottonseed crude oil`,
        search_depth: "advanced",
        max_results: 8,
        days: 7
      })
    });
    const sData = await searchRes.json();
    const newsContext = sData.results?.map(r => r.content).join("\n\n") || "No news found.";

    // 3. ГЕНЕРАЦИЯ (Объединяем цену и новости)
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a strict Commodity Validator. 
            Target Period: Feb 2026. 
            RULES: 
            1. Use MPOC data as the ONLY source for the current palm oil price. 
            2. For news, strictly ignore anything from 2025. 
            3. Use ## for headers. No bolding (*).` 
          },
          { 
            role: "user", 
            content: `PRICE DATA (MPOC): ${priceInfo} \n\n NEWS CONTEXT: ${newsContext}. 
            Create a report with current prices and weekly news.` 
          }
        ],
        temperature: 0.1
      })
    });

    const gData = await groqRes.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `## Error\n${e.message}` });
  }
}
