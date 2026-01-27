import type { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 

// Убрали лишние параметры &v=2, оставили только ключ
const BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

const generateMockData = (timeframe: Timeframe): PriceData[] => {
  const data: PriceData[] = [];
  let lastClose = 3850;
  const count = timeframe === '1D' ? 24 : 30;
  for (let i = 0; i < count; i++) {
    const open = lastClose;
    const close = open + (Math.random() - 0.5) * 40;
    data.push({
      date: new Date(Date.now() - (count - i) * 3600000).toISOString(),
      open: Math.round(open),
      high: Math.round(Math.max(open, close) + 10),
      low: Math.round(Math.min(open, close) - 10),
      close: Math.round(close)
    });
    lastClose = close;
  }
  return data;
};

export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  if (!API_KEY) return { data: generateMockData(timeframe), sources: [], isFallback: true };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Provide real-time FCPO (Palm Oil) prices for ${timeframe} as JSON. format: {"prices": [{"date": "ISO8601", "open": number, "high": number, "low": number, "close": number}]}` }] 
        }]
        // МЫ УДАЛИЛИ "tools", чтобы не было ошибки 400
      })
    });

    const result = await response.json();
    
    // Если API ругается (как сейчас), идем в симуляцию
    if (result.error) {
      console.warn("Google API Error, switching to Mock Data:", result.error.message);
      return { data: generateMockData(timeframe), sources: [], isFallback: true };
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || (Array.isArray(parsed) ? parsed : generateMockData(timeframe)), 
      sources: [], 
      isFallback: false 
    };
  } catch (error) {
    return { data: generateMockData(timeframe), sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async () => {
  if (!API_KEY) return { report: null, sources: [], isFallback: true };
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Weekly market report for Palm Oil Futures in JSON: {'summary': '...', 'outlook': '...'}" }] }]
      })
    });
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return { report: JSON.parse(cleanJson), sources: [], isFallback: false };
  } catch (e) {
    return { report: null, sources: [], isFallback: true };
  }
};
