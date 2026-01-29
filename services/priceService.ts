import { PriceData } from '../types';

export const fetchRealtimePriceData = async (timeframe: string) => {
  try {
    // Стучимся в нашу функцию Vercel
    const response = await fetch(`/api/get-prices?timeframe=${timeframe}`);
    const resData = await response.json();

    if (!resData.choices) {
      console.error("OpenRouter Proxy Error:", resData);
      throw new Error("No choices");
    }

    const content = resData.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: Array.isArray(parsed.prices) ? parsed.prices : [], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return { data: [], isFallback: true };
  }
};
