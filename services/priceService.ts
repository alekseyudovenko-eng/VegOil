import { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const parseSafeJSON = (text: string) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

// 1. Функция для графиков
export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  try {
    if (!API_KEY) return { data: [], sources: [] };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free', 
        messages: [{
          role: 'user',
          content: `Return a JSON array of historical price data for FCPO (Palm Oil) for ${timeframe}. 
          Format: [{"date": "2024-01-01", "open": 3800, "high": 3850, "low": 3780, "close": 3820}]. 
          Return ONLY the array.`
        }]
      })
    });

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '[]';
    const parsed = parseSafeJSON(text);

    return { data: Array.isArray(parsed) ? parsed : [], sources: [] };
  } catch (error) {
    console.error("Fetch price failed:", error);
    return { data: [], sources: [] };
  }
};

// 2. Функция для отчета (Её не хватало!)
export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: any[] }> => {
  try {
    if (!API_KEY) return { report: null, sources: [] };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{
          role: 'user',
          content: `Generate a market report for Vegetable Oils in JSON: {
            "summary": "string",
            "topNews": [{"commodity": "string", "headline": "string", "content": "string"}],
            "priceTrends": [{"commodity": "string", "trend": "up", "details": "string"}],
            "tradeTable": [{"country": "string", "commodity": "string", "volume": "string", "volumeType": "string", "status": "string"}],
            "policyUpdates": [{"country": "string", "update": "string"}]
          }. Return ONLY JSON.`
        }]
      })
    });

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '{}';
    const parsed = parseSafeJSON(text);

    return { report: parsed as MarketReport, sources: [] };
  } catch (error) {
    console.error("Fetch report failed:", error);
    return { report: null, sources: [] };
  }
};
