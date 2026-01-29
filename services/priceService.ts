import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = new GoogleGenAI(GOOGLE_API_KEY);

// ВАЖНО: ЭКСПОРТ №1
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH ONLINE for actual Crude Palm Oil (FCPO) prices on Bursa Malaysia. Today is ${new Date().toDateString()}. Provide daily OHLC data for ${timeframe}. Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}. If search fails, return {"prices": []}.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Bursa Malaysia Live", uri: "https://www.google.com/search?q=FCPO+price" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Price error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

// ВАЖНО: ЭКСПОРТ №2 (из-за отсутствия которого падал билд)
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  const prompt = `Search for latest market news about Vegetable Oils. Return JSON matching MarketReport schema.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const text = result.response.text();
    const report = JSON.parse(text.replace(/```json|```/g, '').trim());

    return { report, sources: [] };
  } catch (error) {
    console.error("Report error:", error);
    return { report: null, sources: [] };
  }
};
