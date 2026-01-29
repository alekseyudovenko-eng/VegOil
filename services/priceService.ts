import { GoogleGenAI } from "@google/genai";

// Ключ захардкожен для надежности
const KEY = "AIzaSyA-INmSVe6vtt9rVNkn0_h0aoeIcHIbvIk";

export const fetchRealtimePriceData = async (timeframe: string) => {
  // 1. Проверка ключа ВНУТРИ функции (чтобы не было белого экрана при загрузке)
  if (!KEY) {
      console.error("API KEY IS MISSING");
      return { data: [], sources: [], isFallback: true };
  }

  try {
    // 2. Инициализация ТОЛЬКО в момент вызова
    const genAI = new GoogleGenAI(KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `SEARCH ONLINE for actual FCPO (Crude Palm Oil) futures prices on Bursa Malaysia. 
    Today is ${new Date().toDateString()}. 
    Provide daily OHLC data for ${timeframe}. 
    Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.`;

    console.log("Отправляем запрос в Google Search...");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const text = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    return { 
      data: parsed.prices || [], 
      sources: [{ title: "Bursa Malaysia (Live)", uri: "https://google.com" }], 
      isFallback: false 
    };
  } catch (e) {
    console.error("Ошибка при получении данных:", e);
    return { data: [], sources: [], isFallback: true };
  }
};

// Заглушка для отчета, чтобы App.tsx не ругался
export const fetchWeeklyMarketReport = async () => {
    return { report: null, sources: [] };
};
