import { PriceData, Timeframe, GroundingSource } from '../types';

// Используем актуальный ID модели Sonar (Llama 3.1)
const MODEL_ID = "perplexity/llama-3.1-sonar-small-128k-online";
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "sk-or-v1-YOUR_KEY_HERE";

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH ONLINE for actual FCPO (Crude Palm Oil) futures prices on Bursa Malaysia. 
  Today is ${new Date().toDateString()}. Provide daily OHLC data for the ${timeframe} period. 
  Return ONLY JSON format: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app", // Важно для OpenRouter
        "X-Title": "VegOil Dashboard"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API Error');
    }

    const resData = await response.json();
    const content = resData.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Perplexity Live Search", uri: "https://www.perplexity.ai" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Price Service Failure:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async () => {
  // Здесь можно использовать Groq для аналитики, так как он быстрее
  return { report: null, sources: [] };
};
