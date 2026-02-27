// services/scraperService.ts

// Запускает парсинг вручную (для тестирования)
export const triggerScraping = async () => {
  try {
    const response = await fetch('/api/scrape-prices');
    return await response.json();
  } catch (error) {
    console.error('Scraping trigger failed:', error);
    return null;
  }
};

// Получает историю из IndexMundi
export const fetchHistoricalData = async (commodity?: string) => {
  try {
    const response = await fetch(`/api/scrape-history?commodity=${commodity || 'sunflower-oil'}`);
    return await response.json();
  } catch (error) {
    console.error('Historical fetch failed:', error);
    return null;
  }
};

// Проверяет статус данных в БД
export const checkDataStatus = async () => {
  try {
    const response = await fetch('/api/get-prices?topic=prices&region=Russia%20%26%20CIS&days=10');
    const data = await response.json();
    return {
      hasRealData: data.meta?.hasRealData,
      dataPoints: data.meta?.dataPoints,
      lastUpdated: data.meta?.lastUpdated
    };
  } catch (error) {
    return { hasRealData: false, dataPoints: 0 };
  }
};
