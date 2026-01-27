import type { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 

// Используем v1 и добавляем v=2 для обхода кэша
export const BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}&v=2`;

export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  console.log("Fetching from URL:", `.../v1/models/${MODEL}...`); // Проверка версии в консоли
  
  if (!API_KEY) return { data: [], sources: [], isFallback: true };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Get FCPO prices for ${timeframe} in JSON format with fields: date, open, high, low, close` }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();
    
    // Если Google вернул ошибку или 404
    if (result.error || !result.candidates) {
      console.error("API Error:", result.error?.message || "No candidates");
      return { data: [], sources: [], isFallback: true };
    }

    const text = result.candidates[0].content.parts[0].text || '{"prices":[]}';
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: Array.isArray(parsed.prices) ? parsed.prices : [], 
      sources: result.candidates[0].groundingMetadata?.groundingChunks || [],
      isFallback: false 
    };
  } catch (error) {
    console.error("Service Catch:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async () => {
  if (!API_KEY) return { report: null, sources: [], isFallback: true };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Provide a weekly market report for FCPO in JSON" }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();
    if (!result.candidates) return { report: null, sources: [], isFallback: true };

    const text = result.candidates[0].content.parts[0].text || "{}";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    return { 
      report: JSON.parse(cleanJson), 
      sources: result.candidates[0].groundingMetadata?.groundingChunks || [],
      isFallback: false 
    };
  } catch (e) {
    return { report: null, sources: [], isFallback: true };
  }
};
