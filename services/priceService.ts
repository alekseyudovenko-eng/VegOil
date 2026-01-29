import { PriceData, Timeframe, GroundingSource } from '../types';

const MODEL_ID = "perplexity/llama-3.1-sonar-small-128k-online";
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "sk-or-v1-YOUR_KEY";

export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  const prompt = `Search for FCPO (Crude Palm Oil) futures prices on Bursa Malaysia. 
  Today is ${new Date().toDateString()}. Return JSON: {"prices": [{"date": "YYYY-MM-DD", "open": 123, "high": 125, "low": 120, "close": 124}]}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app",
        "X-Title": "VegOil"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const resData = await response.json();
    console.log("RAW RESPONSE FROM OPENROUTER:", resData); // СМОТРИМ СЮДА В КОНСОЛИ

    if (!resData.choices) throw new Error("No choices in response");

    const content = resData.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    // Гарантируем, что возвращаем массив, даже если ИИ ошибся
    return { 
      data: Array.isArray(parsed.prices) ? parsed.prices : [], 
      sources: [{ title: "Bursa Malaysia", uri: "#" }], 
      isFallback: false 
    };
  } catch (error) {
    console.error("SERVICE ERROR:", error);
    return { data: [], sources: [], isFallback: true };
  }
};
