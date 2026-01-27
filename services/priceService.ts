import type { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 
// ВАЖНО: Тут исправлен путь к модели
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  if (!API_KEY) return { data: [], sources: [] };

  const prompt = `SEARCH ONLINE for FCPO prices. Return JSON: {"prices": [{"date": "YYYY-MM-DD", "open": 4000, "high": 4050, "low": 3950, "close": 4010}]}`;

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{"prices":[]}';
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { data: parsed.prices || [], sources: [] };
  } catch (error) {
    console.error("Price error:", error);
    return { data: [], sources: [] }; // Не даем приложению упасть
  }
};

export const fetchWeeklyMarketReport = async () => {
  if (!API_KEY) return null;
  const prompt = `SEARCH ONLINE weekly vegetable oil market report for 26 countries. Return JSON.`;
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    return null;
  }
};
