import type { PriceData, MarketReport, Timeframe } from '../types';

// Используем твой ключ
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 

// ВАЖНО: Исправленный URL (версия v1 и корректный путь к модели)
const BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  if (!API_KEY) return { data: [], sources: [] };

  const prompt = `SEARCH ONLINE for real-time FCPO (Crude Palm Oil) prices. 
  Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}`;

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();

    // Если Google выдает ошибку, возвращаем пустой массив, чтобы сайт не «падал»
    if (result.error) {
      console.error("Google API Error:", result.error.message);
      return { data: [], sources: [] };
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{"prices":[]}';
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: parsed.prices || [], 
      sources: result.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.html || [] 
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return { data: [], sources: [] };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<MarketReport | null> => {
  if (!API_KEY) return null;

  const countries = "Azerbaijan, Armenia, Belarus, Bulgaria, Czechia, Croatia, Estonia, France, Germany, UK, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";
  
  const prompt = `SEARCH ONLINE for vegetable oil market report for ${countries}. Return JSON.`;

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }]
      })
    });

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    return null;
  }
};
