export const getMarketReport = async () => {
  try {
    // Вызываем нашу Vercel Function
    const response = await fetch('/api/get-prices');
    
    if (!response.ok) {
      throw new Error('Ошибка при получении отчета');
    }

    const data = await response.json();
    // Возвращаем текст отчета, который прислал Groq
    return data.report; 
  } catch (error) {
    console.error("PriceService Error:", error);
    return "Не удалось загрузить отчет. Проверьте настройки API.";
  }
};

// Если у тебя там были другие функции (например, для графиков), 
// можешь оставить их или использовать mock-данные из mockPriceService.ts
