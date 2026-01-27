import { PriceData, MarketReport, Timeframe } from '../types';

// Твой API ключ из переменных окружения
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Получение данных о ценах
 */
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[], isFallback?: boolean }> => {
  try {
    // Если ключа нет, сразу возвращаем пустые данные, чтобы не валить билд
    if (!API_KEY) throw new Error("API Key missing");

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Give me historical price data for FCPO (Palm Oil) for ${timeframe} timeframe in JSON format: [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]` }] }]
      })
    });

    const result = await response.json();
    // Тут должна быть твоя логика парсинга ответа от Gemini
    // Для успешного билда возвращаем структуру, которую ждет App.tsx
    return { 
      data: [], // Сюда придут распарсенные данные
      sources: result.groundingMetadata?.searchEntryPoint ? [result.groundingMetadata.searchEntryPoint] : [] 
    };
  } catch (error) {
    console.error("Price fetch error:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

/**
 * ПОДДЕРЖКА ОТЧЕТА (Функция, которой не хватало в логах Vercel)
 */
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: any[] }> => {
  try {
    if (!API_KEY) return { report: null, sources: [] };

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Provide a weekly market analysis for Edible Oils. Focus on Palm Oil and Soy Oil." }] }]
      })
    });

    const result = await response.json();
    
    // Возвращаем структуру, соответствующую типу MarketReport из types.ts
    return { 
      report: null, // Здесь будет логика обработки текста в объект
      sources: [] 
    };
  } catch (error) {
    console.error("Report fetch error:", error);
    return { report: null, sources: [] };
  }
};
