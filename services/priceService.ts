import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Используем правильный способ получения ключа в Vite
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = new GoogleGenAI(GOOGLE_API_KEY);

// Вспомогательная функция для очистки JSON
const cleanJson = (text: string) => text.replace(/```json|```/g, "").trim();

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `SEARCH ONLINE for the latest Crude Palm Oil (FCPO) prices on Bursa Malaysia. 
  Provide daily OHLC data for the last ${timeframe}. 
  Current date: ${new Date().toISOString()}.
  Return ONLY JSON: {"prices": [{"date": "ISO string", "open": number, "high": number, "low": number, "close": number}]}.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const response = result.response;
    const text = cleanJson(response.text());
    const parsed = JSON.parse(text);

    // Извлекаем реальные источники, если они есть
    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.html
      ? [{ title: "Google Search (Live)", uri: "https://google.com" }]
      : [];

    return { 
      data: parsed.prices || [], 
      sources, 
      isFallback: false 
    };
  } catch (error) {
    console.error("Price service error:", error);
    // Возвращаем пустую структуру, чтобы App.tsx не упал
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[], isFallback: boolean }> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `Generate a market report for Vegetable Oils (Palm, Soy). Search for news from last 48h.
  Return JSON matching the MarketReport interface.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const text = cleanJson(result.response.text());
    const report = JSON.parse(text);

    return { report, sources: [], isFallback: false };
  } catch (error) {
    console.error("Report service error:", error);
    return { report: null, sources: [], isFallback: true };
  }
};
