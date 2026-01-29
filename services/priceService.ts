import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "ТВОЙ_КЛЮЧ";

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  // ИСПОЛЬЗУЕМ АКТУАЛЬНЫЙ ID МОДЕЛИ. 
  // Perplexity обновили названия. Сейчас Sonar на базе Llama 3.1 доступен так:
  const MODEL_ID = "perplexity/llama-3.1-sonar-small-128k-online"; 

  const prompt = `Search for actual FCPO (Crude Palm Oil) futures prices on Bursa Malaysia for ${timeframe}. 
  Current date: ${new Date().toDateString()}.
  Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.`;

  try {
    console.log("Запрос к OpenRouter с моделью:", MODEL_ID);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app",
        "X-Title": "VegOil Dashboard"
      },
      body: JSON.stringify({
        model: MODEL_ID, 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    const resData = await response.json();

    if (resData.error) {
      // Если модель всё еще "неверная", OpenRouter вернет это здесь
      console.error("ОШИБКА МОДЕЛИ ИЛИ КЛЮЧА:", resData.error.message);
      
      // ПОПЫТКА №2: Если первая модель упала, пробуем универсальную
      if (resData.error.code === 400) {
          console.log("Пробуем альтернативную модель...");
          // Вставь сюда вторую модель если первая не пойдет
      }
      
      return { data: [], sources: [], isFallback: true };
    }

    const content = resData.choices[0].message.content;
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Perplexity Online Search", uri: "https://www.perplexity.ai" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Критическая ошибка сервиса:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport | null, sources: GroundingSource[] }> => {
  return { report: null, sources: [] };
};
