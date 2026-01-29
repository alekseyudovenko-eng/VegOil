import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Используй переменную VITE_OPENROUTER_API_KEY в Vercel 
// или вставь свой ключ строкой ниже для моментальной проверки
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "ТВОЙ_КЛЮЧ_ОТ_OPENROUTER";

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH THE WEB for actual Crude Palm Oil (FCPO) futures prices on Bursa Malaysia for the ${timeframe} period. 
  Current date is ${new Date().toDateString()}.
  Return ONLY a valid JSON object: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.
  If you cannot find real numbers for today, return {"prices": []}. DO NOT MAKE UP NUMBERS.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app", // Обязательно для OpenRouter
        "X-Title": "VegOil App"
      },
      body: JSON.stringify({
        model: "perplexity/llama-3.1-sonar-small-online", 
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const resData = await response.json();
    
    if (!resData.choices) {
        console.error("OpenRouter Error:", resData);
        throw new Error("Invalid response from OpenRouter");
    }

    const content = resData.choices[0].message.content;
    const parsed = JSON.parse(content);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Perplexity Online Search", uri: "https://www.perplexity.ai" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Fetch failed:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

// Заглушка для еженедельного отчета, чтобы не падал билд
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  return { report: null, sources: [] };
};
