import { PriceData, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
        // Используем БЕСПЛАТНУЮ модель, чтобы проверить связь
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
    
    // Если OpenRouter ругается, мы увидим это в консоли
    if (result.error) {
      console.error("OpenRouter Error Details:", result.error);
      return { data: [], sources: [] };
    }

    const text = result.choices?.[0]?.message?.content || '[]';
    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    return { data: JSON.parse(cleanJson), sources: [] };
  } catch (error) {
    console.error("Critical Error:", error);
    return { data: [], sources: [] };
  }
};
