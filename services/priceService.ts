import type { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 
// ИСПОЛЬЗУЕМ v1 — она стабильнее для этого метода
const BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[], isFallback: boolean }> => {
  if (!API_KEY) return { data: [], sources: [], isFallback: true };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Get FCPO prices for ${timeframe} in JSON` }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();
    
    // Если Google вернул ошибку, возвращаем пустой массив (чтобы App.tsx не упал)
    if (result.error || !result.candidates) {
      return { data: [], sources: [], isFallback: true };
    }

    const text = result.candidates[0].content.parts[0].text || '{"prices":[]}';
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || [], 
      sources: result.candidates[0].groundingMetadata?.groundingChunks || [],
      isFallback: false 
    };
  } catch (error) {
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: any[], isFallback: boolean }> => {
  if (!API_KEY) return { report: null, sources: [], isFallback: true };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Weekly market report JSON" }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    return { 
      report: JSON.parse(cleanJson), 
      sources: result.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      isFallback: false 
    };
  } catch (e) {
    return { report: null, sources: [], isFallback: true };
  }
};
