import { GoogleGenAI } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// В Vite переменные окружения берутся так:
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const genAI = new GoogleGenAI(GOOGLE_API_KEY);

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `SEARCH ONLINE for the latest Crude Palm Oil (FCPO) futures prices on Bursa Malaysia. 
  Provide a historical OHLC time series for the past ${timeframe}. 
  Return ONLY a valid JSON object: { "prices": [{ "date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number }] }.
  Ensure the data reflects ACTUAL market prices.`;

  try {
    // Правильный синтаксис для @google/genai
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools: [{ googleSearch: {} }] as any 
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Чистим JSON от возможных маркдаун-тегов ```json
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Извлекаем ссылки из Grounding Metadata
    const searchSources = response.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.html 
      ? [{ title: "Google Search Real-time", uri: "[https://google.com](https://google.com)" }] 
      : [];

    return { 
      data: parsed.prices || [], 
      sources: searchSources,
      isFallback: false 
    };

  } catch (error) {
    console.error("Google AI Error:", error);
    
    // Если Google заблокирован (VPN выключен), используем Groq
    if (GROQ_API_KEY) {
      const groqRes = await fetch('[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const resData = await groqRes.json();
      const parsed = JSON.parse(resData.choices[0].message.content);
      return { data: parsed.prices || [], sources: [], isFallback: true };
    }
    return { data: [], sources: [], isFallback: true };
  }
};
