export const fetchRealtimePriceData = async (timeframe: string) => {
  try {
    const response = await fetch(`/api/get-prices?timeframe=${timeframe}`);
    const resData = await response.json();

    // Если мы сами поймали ошибку в API
    if (resData.isError) {
      alert("API Error: " + resData.message); // Прямо в браузере покажет причину
      return { data: [], isFallback: true };
    }

    if (!resData.choices || resData.choices.length === 0) {
      console.error("No choices in response:", resData);
      return { data: [], isFallback: true };
    }

    const content = resData.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { 
      data: Array.isArray(parsed.prices) ? parsed.prices : [], 
      isFallback: false 
    };
  } catch (error) {
    console.error("Service error:", error);
    return { data: [], isFallback: true };
  }
};
