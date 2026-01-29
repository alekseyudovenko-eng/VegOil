export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  const prompt = `GET REAL TIME DATA: Crude Palm Oil (FCPO) futures price on Bursa Malaysia for ${timeframe}. 
  Provide actual daily OHLC. If you don't have access to real-time search, DO NOT MAKE UP NUMBERS. Return empty JSON {"prices": []}.`;

  try {
    // 1. Пробуем OpenRouter с моделью, которая умеет искать (например, Perplexity или Llama 3.1 Online)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "perplexity/llama-3.1-sonar-small-online", // Эта модель ОБЯЗАНА искать в сети
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const resData = await response.json();
    const content = resData.choices[0].message.content;
    const parsed = JSON.parse(content);

    if (parsed.prices.length === 0) throw new Error("No real data found");
    
    return { data: parsed.prices, sources: [{title: "OpenRouter/Perplexity Search", uri: "#"}], isFallback: false };

  } catch (error) {
    console.error("OpenRouter Search failed, using Groq as local-knowledge fallback...");
    
    // 2. Groq как запасной вариант (но тут данные будут не real-time, а до 2024 года)
    // Здесь мы можем честно написать в интерфейсе: "Data is simulated/historical"
    // ... твой старый код для Groq ...
  }
};
