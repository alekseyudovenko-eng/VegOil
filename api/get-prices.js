export default async function handler(req, res) {
  // Выводим в логи (увидишь в панели Vercel), чтобы проверить, подхватились ли ключи
  console.log("Keys check:", { 
    hasGroq: !!process.env.VITE_GROQ_API_KEY, 
    hasTavily: !!process.env.TAVILY_API_KEY 
  });

  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(500).json({ error: "Missing API keys in Environment Variables" });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10);
  const formatDate = (d) => d.toISOString().split('T')[0];
  const dateRange = `${formatDate(startDate)} to ${formatDate(endDate)}`;

  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `vegetable oil prices news Russia Ukraine EU ${dateRange}`,
        search_depth: "advanced",
        max_results: 10
      })
    });
    
    const searchData = await searchRes.json();
    const context = JSON.stringify(searchData.results);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "ТЫ — ЖЕСТКИЙ РЫНОЧНЫЙ АНАЛИТИК. Выдаешь сухие факты и таблицы. Никакой воды." 
          },
          { 
            role: "user", 
            content: `Контекст поиска за период ${dateRange}: ${context}` 
          }
        ],
        temperature: 0
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
        throw new Error(`Groq Error: ${data.error.message}`);
    }
    
    res.status(200).json({ report: data.choices[0].message.content });

  } catch (error) {
    console.error("Handler Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
