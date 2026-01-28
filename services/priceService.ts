import { PriceData, MarketReport, Timeframe } from '../types';

// Используем ключ OpenRouter
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

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  try {
    if (!API_KEY) return { data: [], sources: [] };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://palm-oil-dashboard.vercel.app', // Опционально для OpenRouter
        'X-Title': 'Palm Oil Price Dashboard'
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [{
          role: 'user',
          content: `Provide historical price data for FCPO (Palm Oil) for ${timeframe}. 
          Return ONLY a JSON array in this format: [{"date": "2024-01-01", "open": 3800, "high": 3850, "low": 3780, "close": 3820}]. 
          Give at least 15 points.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("OpenRouter API Error:", err);
      return { data: [], sources: [] };
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '[]';
    const parsed = parseSafeJSON(text);

    return { 
      data: Array.isArray(parsed) ? parsed : [], 
      sources: [] 
    };
  } catch (error) {
    console.error("Fetch failed:", error);
    return { data: [], sources: [] };
  }
};

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
        model: 'google/gemini-flash-1.5',
        messages: [{
          role: 'user',
          content: `Generate a market report for Vegetable Oils (Palm, Soy, Sunflower) in JSON format: {
            "summary": "string",
            "topNews": [{"commodity": "string", "headline": "string", "content": "string"}],
            "priceTrends": [{"commodity": "string", "trend": "up", "details": "string"}],
            "tradeTable": [{"country": "string", "commodity": "string", "volume": "string", "volumeType": "string", "status": "string"}],
            "policyUpdates": [{"country": "string", "update": "string"}]
          }. Return ONLY JSON.`
        }]
      })
    });

    if (!response.ok) return { report: null, sources: [] };

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '{}';
    const parsed = parseSafeJSON(text);

    return { report: parsed as MarketReport, sources: [] };
  } catch (error) {
    console.error("Report fetch failed:", error);
    return { report: null, sources: [] };
  }
};
