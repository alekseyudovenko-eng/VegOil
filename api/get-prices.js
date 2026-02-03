export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  // 1. Вычисляем даты для запроса
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const dateRange = `from ${sevenDaysAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;

  try {
    // 2. Поиск с акцентом на свежесть (time_range)
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Добавляем конкретику по неделе прямо в запрос
        query: `FCPO prices news and vegetable oil market report weekly summary ${dateRange} Russia Kazakhstan Uzbekistan`,
        search_depth: "advanced",
        max_results: 8,
        // Позволяет Tavily приоритизировать самые свежие статьи
        days: 7 
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results.map(r => r.content).join("\n\n");

    // 3. Инструктируем ИИ обработать именно недельный срез
    const systemRole = `You are a financial analyst reporting on the LAST 7 DAYS (${dateRange}). 
    Your goal is to summarize weekly movements.`;

    const userPrompt = `
    CONTEXT FROM LAST 7 DAYS:
    ${context}

    TASK:
    1. Create a weekly summary for the Executive Summary.
    2. In "data", provide a daily price series for the last 15-20 days to show the trend leading up to today.
    3. Ensure "tradeTable" reflects the most recent volumes mentioned in this week's news.
    ... (остальной JSON промпт)
    `;

    // ... (вызов Groq и отправка ответа)
