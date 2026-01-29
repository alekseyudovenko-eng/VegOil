import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Используем Vite-окружение
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = new GoogleGenAI(GOOGLE_API_KEY || "");

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH ONLINE for actual FCPO (Crude Palm Oil) futures prices on Bursa Malaysia. Today is ${new Date().toDateString()}. Provide daily OHLC data for ${timeframe}. Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}. If no real-time data found, return {"prices": []}.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { data: parsed.prices || [], sources: [{title: "Google Live Search", uri: "https://google.com"}], isFallback: false };
  } catch (e) {
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  const prompt = `Search for news about Palm Oil and Soy Oil. Return JSON.`;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });
    const report = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    return { report, sources: [] };
  } catch (e) {
    return { report: null, sources: [] };
  }
};
