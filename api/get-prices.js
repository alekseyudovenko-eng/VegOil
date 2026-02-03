export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // 1. Поиск через Tavily (он в РФ обычно работает стабильно через VPN)
    const search = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Добавили жесткий фильтр текущего месяца и года
        query: "palm oil FCPO price news February 2026 Malaysia Indonesia India", 
        search_depth: "advanced",
        max_results: 10,
        days: 7 // СТРОГО последние 7 дней
      })
    });

    // 2. Запрос к Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a market analyst. Respond in English." },
          { role: "user", content: `Generate a Market Intelligence Report based on this news: ${context}. Use sections: Executive Summary, Top News, Regulatory, Trends, Trade Flows.` }
        ],
        temperature: 0.1
      })
    });

    if (groqRes.status === 429) {
      return res.status(200).json({ report: "### Groq is cooling down\nToo many requests. Please wait 30 seconds and refresh the page. This is a limit of the free plan." });
    }

    const gData = await groqRes.json();
    res.status(200).json({ report: gData.choices[0].message.content });

  } catch (e) {
    res.status(200).json({ report: `### Error\n${e.message}` });
  }
}
