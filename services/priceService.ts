import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Вставь свой ключ OpenRouter сюда или проверь VITE_OPENROUTER_API_KEY в Vercel
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "sk-or-v1-YOUR_KEY_HERE";

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH THE WEB for actual daily OHLC prices of Crude Palm Oil (FCPO) futures on Bursa Malaysia for the ${timeframe} period. 
  Today is ${new Date().toDateString()}.
  Return ONLY a valid JSON object: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.
  If you cannot find real data, return {"prices": []}. DO NOT FABRICATE NUMBERS.`;

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
        model: "perplexity/llama-3.1-sonar-small-online", 
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const resData = await response.json();
    
    if (!resData.choices || resData.choices.length === 0) {
        throw new Error("OpenRouter return empty choices");
    }

    const content = resData.choices[0].message.content;
    const parsed = JSON.parse(content);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Perplexity Real-time Search", uri: "https://www.perplexity.ai" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("OpenRouter fetch error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

// Заглушка для отчета, чтобы проект собрался
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  return { report: null, sources: [] };
};
