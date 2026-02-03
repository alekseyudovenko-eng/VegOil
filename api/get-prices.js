export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  // Динамически вычисляем даты для запроса
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  
  const dateRange = `from ${lastWeek.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;

  try {
    // 1. Поиск строго за последнюю неделю
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        // Ищем конкретно новости по MYX FCPO и всему сектору
        query: `MYX:FCPO1! news palm oil soybean oil sunflower oil market report ${dateRange}`,
        search_depth: "advanced",
        max_results: 8,
        // Ограничиваем только финансовыми и новостными доменами для качества
        include_domains: [
          "tradingview.com", "reuters.com", "investing.com", 
          "brecorder.com", "thestar.com.my", "bloomberg.com", 
          "mpoo.gov.my"
        ]
      })
    });

    const sData = await searchRes.json();
    const context = sData.results?.map(r => `Source: ${r.url}\nDate: ${r.published_date || 'Recent'}\nContent: ${r.content}`).join("\n\n");

    // 2. Инструкции для Groq: жесткая фильтрация дат
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are a Commodities Intelligence Analyst. 
            STRICT RULES:
            1. ONLY report news from the LAST 7 DAYS (Feb 2026). 
            2. If data is older than Jan 26 2026, IGNORE IT.
            3. Use Russian language.
            4. Use professional financial tone.` 
          },
          { 
            role: "user", 
            content: `Generate a 'Market Intelligence Report: Vegetable Oils & Fats' based on this context:
            
            ${context}

            Structure:
            ## Executive Summary
            (Краткий итог недели: бычий/медвежий тренд)

            ## Top News by Commodity
            * **Palm Oil (FCPO1!)**: (Новости с TradingView и биржи MYX, уровни поддержки/сопротивления)
            * **Soybean Oil**: (США/Бразилия, отчеты за неделю)
            * **Sunflower & Rapeseed Oil**: (Экспорт и цены)
            * **Crude Oil & Biofuel**: (Влияние на масла)

            ## Regulatory & Policy Updates
            (Мандаты B35/B40, пошлины, квоты за неделю)

            ## Market Trend Analysis
            (Технический анализ графика FCPO: что произошло за последние 5 сессий)

            ## Trade Flows & Production
            (Логистика и данные по урожаю)`
          }
        ],
        temperature: 0.1 // Минимальная фантазия, максимум фактов
      })
    });

    const gData = await groqRes.json();
    const reportText = gData.choices[0].message.content;

    res.status(200).json({
      report: reportText,
      sources: sData.results.map(r => ({ title: r.title, url: r.url })),
      data: [] 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
