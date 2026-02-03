export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  try {
    // Проверка ключей
    if (!TAVILY_KEY || !GROQ_KEY) {
      throw new Error("API Keys missing in Vercel Environment Variables");
    }

    // 1. Поиск строго по FCPO за неделю
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "palm oil fcpo news market report last 7 days feb 2026",
        search_depth: "advanced",
        max_results: 5
      })
    });

    if (!searchRes.ok) throw new Error("Tavily API failed");
    const sData = await searchRes.json();
    const context = sData.results?.map(r => r.content).join("\n") || "No recent news found";

    // 2. Генерация отчета
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Ты аналитик рынка. Составь Market Intelligence Report: Vegetable Oils & Fats." },
          { role: "user", content: `Данные за неделю: ${context}. Используй разделы: Executive Summary, Top News by Commodity, Regulatory & Policy Updates, Market Trend Analysis, Trade Flows & Production.` }
        ],
        temperature: 0.1
      })
    });

    if (!groqRes.ok) throw new Error("Groq API failed");
    const gData = await groqRes.json();

    return new Response(JSON.stringify({
      report: gData.choices[0].message.content,
      sources: sData.results || []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    // ЗАПАСНОЙ ВЫХОД: Если API упал, мы все равно отдаем структуру, чтобы не было ПУСТО
    return new Response(JSON.stringify({
      report: "## Executive Summary\nОшибка получения живых данных: " + error.message + "\n\nПожалуйста, проверьте API ключи в панели Vercel.",
      sources: []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
