import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Используем твой ключ OpenRouter
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "ТВОЙ_КЛЮЧ";

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH ONLINE for actual Crude Palm Oil (FCPO) futures prices on Bursa Malaysia for ${timeframe}. 
  Current date is ${new Date().toDateString()}.
  Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        // Эти два заголовка важны для OpenRouter
        "HTTP-Referer": "https://localhost:3000", 
        "X-Title": "VegOil Dashboard"
      },
      body: JSON.stringify({
        model: "perplexity/llama-3.1-sonar-small-online", 
        messages: [{ role: "user", content: prompt }],
        // Не используем response_format: json_object, так как Sonar иногда на нем глючит и выдает 400
        temperature: 0.1
      })
    });

    const resData = await response.json();

    // Если сервер вернул ошибку в JSON (например, 400)
    if (resData.error) {
      console.error("OpenRouter API Error:", resData.error.message);
      return { data: [], sources: [], isFallback: true };
    }

    const content = resData.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Perplexity Online Search", uri: "https://www.perplexity.ai" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Network or Parsing Error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  return { report: null, sources: [] };
};
