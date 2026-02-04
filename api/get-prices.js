export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    // 1. БЫСТРЫЙ И ТОЧНЫЙ ПОИСК
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Запрос сфокусирован на конкретных тикерах
        query: `Price Feb 2026: Palm Oil MYR/T FCPO, Soybean Oil CBOT, Sunflower Oil FOB, Rapeseed Oil price, Brent Crude price`,
        search_depth: "basic", // Возвращаем basic для скорости (чтобы Vercel не рубил связь)
        max_results: 5,
        days: 2
      })
    });
    
    const sData = await searchRes.json();
    
    // Если Tavily пустой, выдаем ошибку сразу
    if (!sData.results || sData.results.length === 0) {
      throw new Error("Search provider returned no data.");
    }

    const context = sData.results.map(r => r.content).join("\n");

    // 2. ГЕНЕРАЦИЯ ОТЧЕТА
    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: `You are a Commodity Analyst. Today is ${dateStr}.
            - PALM OIL: Show only in MYR/T.
            - OILS: Ensure it is OIL price, not seeds. (Rapeseed OIL is >800 EUR).
            - BRENT: Real-time crude price.
            Format: [SYMBOL] NAME: PRICE (CHANGE).` 
          },
          { role: "user", content: `Data: ${context}` }
        ],
        temperature: 0
      })
    });

    const gData = await groqReport.json();
    const resultText = gData.choices?.[0]?.message?.content;

    if (!resultText) throw new Error("Intelligence core returned no text.");

    res.status(200).json({ report: resultText, chartData: [] });

  } catch (e) {
    // Выводим ошибку прямо в интерфейс, чтобы понять, ЧТО именно сломалось
    res.status(200).json({ 
      report: `## SYSTEM_DIAGNOSTICS\n**Status:** ERROR\n**Source:** ${e.message}\n**Action:** Re-calculating. Please refresh in 5s.`, 
      chartData: [] 
    });
  }
}
