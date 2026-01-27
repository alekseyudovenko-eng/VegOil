import type { PriceData, MarketReport, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash"; 
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: any[] }> => {
  if (!API_KEY) throw new Error("API Key missing");

  const prompt = `SEARCH ONLINE for real-time FCPO (Crude Palm Oil) futures prices for the ${timeframe} timeframe. 
  Extract historical OHLC data (exactly 30 points) from Bursa Malaysia or TradingView.
  Return ONLY a strict JSON object: 
  {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}], "sources": [{"title": string, "url": string}]}`;

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Правильное название инструмента для живого поиска
      tools: [{ googleSearchRetrieval: {} }] 
    })
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(`Google API Error: ${result.error.message}`);
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  // Очищаем JSON от возможных markdown-оберток
  const cleanJson = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleanJson);

  // Извлекаем ссылки на источники из метаданных Google
  const groundingSources = result.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.html || "";

  return { 
    data: parsed.prices || [], 
    sources: parsed.sources || [] 
  };
};

export const fetchWeeklyMarketReport = async (): Promise<MarketReport> => {
  const countries = "Azerbaijan, Armenia, Belarus, Bulgaria, Czechia, Croatia, Estonia, France, Germany, UK, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";
  
  const prompt = `PERFORM A REAL-TIME WEB SEARCH for vegetable oil markets (Palm, Sunflower, Rapeseed, Soy, Margarine) for the current week (January 2026).
  Focus on policy and prices in: ${countries}.
  Return ONLY JSON with these exact keys:
  {
    "summary": "string",
    "topNews": [{"commodity": "string", "headline": "string", "content": "string"}],
    "policyUpdates": [{"country": "string", "update": "string"}],
    "tradeTable": [{"country": "string", "commodity": "string", "volume": "string", "volumeType": "Export/Import/Processing", "status": "string"}],
    "priceTrends": [{"commodity": "string", "trend": "string", "details": "string"}],
    "regionalHighlights": [{"region": "string", "events": "string"}]
  }`;

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
};
