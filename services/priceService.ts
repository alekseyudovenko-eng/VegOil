import { PriceData, MarketReport, Timeframe } from '../types';

// Используем переменную окружения Vite
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

/** * Используем стабильный эндпоинт v1. 
 * Если v1 не сработает в твоем регионе, можно будет вернуть v1beta.
 */
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Вспомогательная функция для очистки JSON-ответа от Gemini
 */
const parseGeminiResponse = (jsonString: string) => {
  try {
    // Удаляем Markdown разметку (```json ... ```), которую любит добавлять Gemini
    const cleanJson = jsonString.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Ошибка парсинга JSON от Gemini:", e);
    return null;
  }
};

/**
 * Получение данных о ценах
 */
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  try {
    if (!API_KEY) {
      console.error("VITE_GOOGLE_API_KEY не настроен в Vercel!");
      return { data: [], sources: [] };
    }

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Return a JSON array of historical price data for FCPO (Palm Oil) for ${timeframe}. 
            Required format: [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]. 
            Provide at least 20 data points. Do not write any explanations, only the JSON array.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google API Error:", errorData);
      return { data: [], sources: [] };
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const data = parseGeminiResponse(textResponse);

    return { 
      data: Array.isArray(data) ? data : [], 
      sources: result.groundingMetadata?.searchEntryPoint ? [result.groundingMetadata.searchEntryPoint] : [] 
    };
  } catch (error) {
    console.error("fetchRealtimePriceData failed:", error);
    return { data: [], sources: [] };
  }
};

/**
 * Получение рыночного отчета
 */
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: any[] }> => {
  try {
    if (!API_KEY) return { report: null, sources: [] };

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a market report for Vegetable Oils (Palm, Soy, Sunflower) in JSON format. 
            Use this structure: {
              "summary": "string",
              "topNews": [{"commodity": "string", "headline": "string", "content": "string"}],
              "priceTrends": [{"commodity": "string", "trend": "up", "details": "string"}],
              "tradeTable": [{"country": "string", "commodity": "string", "volume": "string", "volumeType": "string", "status": "string"}],
              "policyUpdates": [{"country": "string", "update": "string"}]
            }. Return ONLY JSON.`
          }]
        }]
      })
    });

    if (!response.ok) return { report: null, sources: [] };

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const report = parseGeminiResponse(textResponse);

    return { 
      report: report as MarketReport, 
      sources: [] 
    };
  } catch (error) {
    console.error("fetchWeeklyMarketReport failed:", error);
    return { report: null, sources: [] };
  }
};
