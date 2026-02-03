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
    // ШАГ 1: Поиск строго по тикеру и за последние 7 дней
    const searchQuery = "palm oil fcpo market news analysis last 7 days february 2026";
    
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: searchQuery,
        search_depth: "advanced",
        max_results: 8
      })
    });

    const sData = await searchRes.json();
    const context = sData.results?.map(r => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

    // ШАГ 2: Генерация ПОЛНОЦЕННОГО отчета по твоей структуре
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "Ты — старший аналитик рынка Vegetable Oils & Fats. Твоя специализация — FCPO. Используй профессиональный русский язык и финансовую терминологию." 
          },
          { 
            role: "user", 
            content: `Используя данные по FCPO за последние 7 дней:
            ${context}

            Сформируй полноценный 'Market Intelligence Report: Vegetable Oils & Fats' со следующими разделами:

            ## Executive Summary
            (Краткий обзор ситуации на основе динамики FCPO за неделю)

            ## Top News by Commodity
            * **Palm Oil**: (Детально по FCPO, уровни, объемы)
            * **Sunflower Oil, Rapeseed Oil, Soybean Oil**: (Как динамика FCPO повлияла на эти масла или новости по ним из контекста)
            * **Margarine**: (Спрос со стороны пищевой пром-ти на фоне цен FCPO)
            * **Crude Oil**: (Взаимосвязь с энергией)

            ## Regulatory & Policy Updates
            (Новости по пошлинам и мандатам за последние 7 дней)

            ## Market Trend Analysis
            (Анализ тренда FCPO за неделю)

            ## Trade Flows & Production
            (Отгрузки и производство масличных)` 
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
