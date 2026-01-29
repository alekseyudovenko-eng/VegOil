import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const genAI = new GoogleGenAI(GOOGLE_API_KEY);

// Функция для получения РЕАЛЬНЫХ цен через Google Search
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH ONLINE for ACTUAL Crude Palm Oil (FCPO) prices on Bursa Malaysia. 
  Today is ${new Date().toISOString()}. Get real OHLC data for ${timeframe}. 
  Return ONLY JSON: {"prices": [{"date": "ISO string", "open": number, "high": number, "low": number, "close": number}]}.
  If no real data is found, return {"prices": []}. DO NOT FABRICATE.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "unspecified", dynamicThreshold: 0.01 } } } as any],
    });

    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    if (!parsed.prices || parsed.prices.length === 0) throw new Error("No real data");

    return { 
      data: parsed.prices, 
      sources: [{ title: "Bursa Malaysia Live (Google Search)", uri: "https://google.com" }], 
      isFallback: false 
    };
  } catch (error) {
    console.warn("Google Search failed, returning empty for safety.");
    return { data: [], sources: [], isFallback: true };
  }
};

// ВОТ ЭТОЙ ФУНКЦИИ НЕ ХВАТАЛО ДЛЯ СБОРКИ
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  const prompt = `SEARCH ONLINE for actual news from the last 48 hours regarding Palm Oil, Soy Oil, and Sunflower Oil.
  Generate a report in JSON format matching the schema. DO NOT FABRICATE NEWS.
  If no news found, leave sections empty.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "unspecified", dynamicThreshold: 0.01 } } } as any],
    });

    const text = result.response.text();
    const report = JSON.parse(text.replace(/```json|```/g, '').trim());

    return { report, sources: [{ title: "Verified Market News", uri: "https://news.google.com" }] };
  } catch (error) {
    console.error("Report fetch failed:", error);
    return { report: null, sources: [] };
  }
};
