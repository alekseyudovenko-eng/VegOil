export default async function handler(req, res) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  // 1. Формируем даты для отчета
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10);
  const formatDate = (d) => d.toISOString().split('T')[0];
  const dateRange = `${formatDate(startDate)} to ${formatDate(endDate)}`;

  try {
    // 2. Сбор данных через Tavily
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `oil prices, sunflower rapeseed palm oil duties Russia Ukraine EU Central Asia news ${dateRange}`,
        search_depth: "advanced",
        max_results: 10
      })
    });
    
    const searchData = await searchRes.json();
    const context = JSON.stringify(searchData.results); // Заполняем контекст для промпта

    // 3. Твой блок с Groq (который ты прислал)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `ТЫ — ЖЕСТКИЙ РЫНОЧНЫЙ АНАЛИТИК...` // Твой текст здесь
          },
          { 
            role: "user", 
            content: `Контекст поиска: ${context}...` // Твой текст здесь
          }
        ],
        temperature: 0
      })
    });

    const data = await groqResponse.json();
    
    // 4. Отправляем готовый отчет на фронтенд
    res.status(200).json({ report: data.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
