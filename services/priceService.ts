import { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

/**
 * Используем v1beta, так как она чаще поддерживает новые модели Flash
 * в разных регионах. Если будет 404, заменим на v1.
 */
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Универсальный парсер для ответов Gemini
 */
const parseSafeJSON = (text: string) => {
  try {
    // Удаляем Markdown-обертки ```json ... ``` и лишние пробелы
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    return null;
  }
};

/**
 * Запрос исторических данных (FCPO)
 */
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  try {
    if (!API_KEY) {
      console.warn("API Key is missing!");
      return { data: [], sources: [] };
    }

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Return a JSON array of historical price data for FCPO (Palm Oil) for ${timeframe}. 
            Format: [{"date": "2024-01-01", "open": 3800, "high": 3850, "low": 3780, "close": 3820}]. 
            Return ONLY the array. No talk, no markdown.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini API Error details:", error);
      return { data: [], sources: [] };
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const parsed = parseSafeJSON(text);

    return { 
      data: Array.isArray(parsed) ? parsed : [], 
      sources: result.groundingMetadata?.searchEntryPoint ? [result.groundingMetadata.searchEntryPoint] : []
    };
  } catch (error) {
    console.error("Fetch price data failed:", error);
    return { data: [], sources: [] };
  }
};

/**
 * Запрос еженедельного отчета
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
            text: `Generate a vegetable oil market report in JSON: {
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
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = parseSafeJSON(text);

    return { 
      report: parsed as MarketReport, 
      sources: [] 
    };
  } catch (error) {
    console.error("Fetch report failed:", error);
    return { report: null, sources: [] };
  }
};
