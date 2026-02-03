export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!TAVILY_KEY || !GROQ_KEY) {
    return new Response(JSON.stringify({ error: "Missing API Keys" }), { status: 500 });
  }

  try {
    // 1. Поиск по самому широкому и точному запросу за последние 7 дней
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "palm oil fcpo news market report last 7 days february 2026",
        search_depth: "advanced",
        max_results: 8,
        // Оставляем поиск открытым по всему вебу, чтобы собрать максимум реальных цен и новостей
      })
    });

    const sData = await searchRes.json();
    const context = sData.results?.map(r => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

    // 2. ИИ перерабатывает весь этот массив новостей в твой формат
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "Ты — профессиональный рыночный аналитик. Твоя задача — извлечь факты за ПОСЛЕДНИЕ 7 ДНЕЙ и составить отчет. Если данные старые — игнорируй их. Язык: Русский." 
          },
          { 
            role: "user", 
            content: `На основе найденных новостей:
            ${context}

            Сформируй Market Intelligence Report: Vegetable Oils & Fats:
            ## Executive Summary
            ## Top News by Commodity (Palm Oil; Sunflower Oil; Rapeseed Oil; Soybean Oil; Margarine; Crude Oil)
            ## Regulatory & Policy Updates
            ## Market Trend Analysis
            ## Trade Flows & Production` 
          }
        ],
        temperature: 0.1
      })
    });

    const gData = await groqRes.json();
    const reportText = gData.choices[0]?.message?.content;

    return new Response(JSON.stringify({
      report: reportText,
      sources: sData.results?.map(r => ({ title: r.title, url: r.url })) || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
