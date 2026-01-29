import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Пытаемся достать ключ из окружения Vite
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// Инициализируем SDK только если ключ физически существует
// Если ключа нет, создаем "пустышку", чтобы не было Uncaught Error
const genAI = apiKey ? new GoogleGenAI(apiKey) : null;

const cleanJson = (text: string) => text.replace(/```json|```/g, "").trim();

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  // Если ключа нет, сразу возвращаем пустой результат, не ломая приложение
  if (!genAI) {
    console.error("API Key is missing! Check VITE_GOOGLE_API_KEY in Vercel.");
    return { data: [], sources: [], isFallback: true };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `SEARCH ONLINE for actual FCPO (Crude Palm Oil) futures prices on Bursa Malaysia. 
    Today is ${new Date().toDateString()}. Provide daily OHLC data for ${timeframe}. 
    Return ONLY JSON: {"prices": [{"date": "ISO string", "open": number, "high": number, "low": number, "close": number}]}.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const response = result.response;
    const text = cleanJson(response.text());
    const parsed = JSON.parse(text);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Google Live Search", uri: "https://google.com" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Price fetch error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  if (!genAI) return { report: null, sources: [] };

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
    console.error("Report fetch error:", error);
    return { report: null, sources: [] };
  }
};
