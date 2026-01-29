import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// ХАРДКОД КЛЮЧА (чтобы точно заработало)
const API_KEY = "AIzaSyA-INmSVe6vtt9rVNkn0_h0aoeIcHIbvIk";
const genAI = new GoogleGenAI(API_KEY);

const cleanJson = (text: string) => text.replace(/```json|```/g, "").trim();

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `SEARCH ONLINE for actual FCPO (Crude Palm Oil) futures prices on Bursa Malaysia. Today is ${new Date().toDateString()}. Provide daily OHLC data for ${timeframe}. Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const text = cleanJson(result.response.text());
    const parsed = JSON.parse(text);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Google Live Search", uri: "https://google.com" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Price error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Search for latest market news about Vegetable Oils. Return JSON.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const report = JSON.parse(cleanJson(result.response.text()));
    return { report, sources: [] };
  } catch (error) {
    console.error("Report error:", error);
    return { report: null, sources: [] };
  }
};
