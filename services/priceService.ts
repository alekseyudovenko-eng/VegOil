export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  const prompt = `REAL-TIME SEARCH REQUIRED. Use online tools to find the ACTUAL historical OHLC prices for Bursa Malaysia Crude Palm Oil (FCPO) futures for the period: ${timeframe}. 
  Today is ${new Date().toLocaleDateString()}.
  Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}.
  IF YOU CANNOT FIND REAL DATA, RETURN {"prices": []}. DO NOT FABRICATE.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Используем поисковую модель от Perplexity через OpenRouter
        model: "perplexity/llama-3.1-sonar-small-online", 
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const resData = await response.json();
    const content = resData.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Если модель вернула пустой список — значит, данных нет, и это ЧЕСТНО.
    return { 
      data: parsed.prices, 
      sources: [{title: "OpenRouter / Perplexity Search", uri: "#"}], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Real-time fetch failed");
    return { data: [], sources: [], isFallback: true };
  }
};
