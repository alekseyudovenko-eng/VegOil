import { PriceData, MarketReport, Timeframe } from '../types';

// Используем переменную окружения для Vite
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Получение исторических данных о ценах через Gemini
 */
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  try {
    if (!API_KEY) {
      console.error("API Key is missing in Vercel Environment Variables");
      return { data: [], sources: [] };
    }

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Return a JSON array of historical price data for FCPO (Palm Oil) for ${timeframe} timeframe. 
            Use this exact format: [{"date": "2024-01-01", "open": 3800, "high": 3850, "low": 3780, "close": 3820}]. 
            Provide at least 15-20 data points. Do not include any text before or after the JSON array.`
          }]
        }]
      })
    });

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Очистка ответа от Markdown (Gemini часто добавляет ```json ... ```)
    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return { 
      data: Array.isArray(parsedData) ? parsedData : [], 
      sources: result.groundingMetadata?.searchEntryPoint ? [result.groundingMetadata.searchEntryPoint] : [] 
    };
  } catch (error) {
    console.error("Error fetching price data:", error);
    return { data: [], sources: [] };
  }
};

/**
 * Получение еженедельного рыночного отчета
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
            text: `Act as a market analyst. Generate a weekly report for Vegetable Oils (Palm, Soy, Sunflower) in JSON format.
            The structure must be: {
              "summary": "general overview",
              "topNews": [{"commodity": "Palm Oil", "headline": "string", "content": "string"}],
              "priceTrends": [{"commodity": "Soy Oil", "trend": "up", "details": "string"}],
              "tradeTable": [{"country": "Malaysia", "commodity": "CPO", "volume": "500k", "volumeType": "Export", "status": "Active"}],
              "policyUpdates": [{"country": "Indonesia", "update": "string"}]
            }`
          }]
        }]
      })
    });

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    const parsedReport = JSON.parse(cleanJson);

    return { 
      report: parsedReport as MarketReport, 
      sources: [] 
    };
  } catch (error) {
    console.error("Error fetching market report:", error);
    return { report: null, sources: [] };
  }
};
