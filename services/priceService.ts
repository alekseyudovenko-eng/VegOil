import type { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 

// ИСПРАВЛЕНО: Добавлено /models/ в путь
const BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[], isFallback: boolean }> => {
  if (!API_KEY) return { data: [], sources: [], isFallback: true };

  const prompt = `SEARCH ONLINE for real-time FCPO (Crude Palm Oil) prices. Return ONLY JSON: {"prices": [{"date": "2026-01-27T10:00:00Z", "open": 4000, "high": 4050, "low": 3950, "close": 4010}]}`;

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

    // Извлекаем источники из метаданных Google
    const rawSources = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawSources.map((s: any) => ({
      title: s.web?.title || "Market Source",
      uri: s.web?.uri || "#"
    }));

    return { 
      data: parsed.prices || [], 
      sources: sources,
      isFallback: false 
    };
  } catch (error) {
    console.error("Price fetch error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: any[], isFallback: boolean }> => {
  if (!API_KEY) return { report: null, sources: [], isFallback: true };

  const prompt = `SEARCH ONLINE for vegetable oil market report. Return ONLY JSON with keys: summary, topNews, policyUpdates, tradeTable, priceTrends, regionalHighlights.`;

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
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(cleanJson);

    const rawSources = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawSources.map((s: any) => ({
      title: s.web?.title || "Market Report Source",
      uri: s.web?.uri || "#"
    }));

    return { report, sources, isFallback: false };
  } catch (e) {
    return { report: null, sources: [], isFallback: true };
  }
};
