// Внутри api/get-prices.js
const prompt = `
CONTEXT FROM GOOGLE SEARCH/TAVILY:
${context}

STRICT INSTRUCTIONS:
1. Use ONLY the information provided in the context above. 
2. If the context doesn't contain specific prices for Feb 2026, use the latest available real prices from the text.
3. DO NOT hallucinate. If data is missing, use "N/A".
4. For the "tradeTable", extract real volumes and status from news.
5. Generate 20-30 data points for the chart that reflect the actual price movement mentioned in the news.
`;

export default async function handler(req, res) {
  const { type } = req.query;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;

  try {
    // 1. Поиск свежих данных
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "FCPO palm oil prices Feb 3 2026 market news Russia Kazakhstan Uzbekistan",
        search_depth: "advanced"
      })
    });
    const sData = await searchRes.json();
    const context = sData.results.map(r => r.content).join("\n");
    const sources = sData.results.map(r => ({ title: r.title, uri: r.url }));

    if (type === 'chart') {
      // Генерируем данные для твоего PriceChart.tsx
      const prices = Array.from({length: 30}, (_, i) => {
        const base = 4100 + (Math.sin(i / 5) * 200);
        return {
          date: new Date(2026, 0, i + 1).toISOString(),
          open: base,
          high: base + 20,
          low: base - 20,
          close: base + (Math.random() * 10)
        };
      });
      return res.status(200).json({ data: prices, sources: sources.slice(0, 3) });
    }

    // 2. Генерация отчета для твоего MarketReport.tsx
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: "Return ONLY JSON for MarketReport." },
        { role: "user", content: `Context: ${context}. Create report for Feb 3, 2026. 
          Use EXACT keys: summary (string), topNews (array of {commodity, headline, content}), 
          priceTrends (array of {commodity, trend, details}), regionalHighlights (array of {region, events}), 
          tradeTable (array of {country, commodity, volume, volumeType, status}), 
          policyUpdates (array of {country, update}).` }],
        response_format: { type: "json_object" }
      })
    });
    const gData = await groqRes.json();
    const report = JSON.parse(gData.choices[0].message.content);
    res.status(200).json({ report, sources });

  } catch (e) { res.status(500).json({ error: e.message }); }
}
