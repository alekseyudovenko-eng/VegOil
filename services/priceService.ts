// ... (начало без изменений)

export const fetchRealtimePriceData = async (timeframe: Timeframe) => {
  if (!API_KEY) return { data: generateMockData(timeframe), sources: [], isFallback: true };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Provide FCPO prices for ${timeframe} in JSON format. Return only JSON object with "prices" key.` }] }]
      })
    });

    const result = await response.json();
    
    // Если Google выдал 404 или ошибку ключа
    if (result.error || !result.candidates?.[0]) {
      return { data: generateMockData(timeframe), sources: [], isFallback: true };
    }

    let text = result.candidates[0].content.parts[0].text || "";
    // Улучшенная очистка от Markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(text);
    const prices = parsed.prices || (Array.isArray(parsed) ? parsed : []);

    return { 
      data: prices.length > 0 ? prices : generateMockData(timeframe), 
      sources: result.candidates[0].groundingMetadata?.groundingChunks || [],
      isFallback: prices.length === 0 
    };
  } catch (error) {
    console.error("Price Service Error:", error);
    return { data: generateMockData(timeframe), sources: [], isFallback: true };
  }
};

// ... (fetchWeeklyMarketReport аналогично с обработкой текста)
