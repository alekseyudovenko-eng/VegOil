import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "ТВОЙ_КЛЮЧ";

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  // Уточняем промпт: просим искать на конкретных биржах
  const prompt = `Search for Crude Palm Oil (FCPO) futures daily prices on Bursa Malaysia or Investing.com for the last ${timeframe}. 
  Current date: ${new Date().toDateString()}.
  Return a JSON object with a "prices" array containing "date" (YYYY-MM-DD), "open", "high", "low", "close" (numbers). 
  If today's data is not yet available, use the latest available closing prices.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app",
        "X-Title": "VegOil App"
      },
      body: JSON.stringify({
        // Меняем на более мощную модель поиска
        model: "perplexity/llama-3.1-sonar-large-online", 
        messages: [{ role: "user", content: prompt }],
        // Убираем жесткий json_object, иногда он мешает модели думать
        temperature: 0.1 
      })
    });

    const resData = await response.json();
    const content = resData.choices[0].message.content;
    
    // Чистим ответ от Markdown, если модель его добавила
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Bursa Malaysia / Perplexity", uri: "https://www.tradingview.com/symbols/MYX-FCPO1!/" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  return { report: null, sources: [] };
};
