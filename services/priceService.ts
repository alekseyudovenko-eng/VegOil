export const fetchRealtimePriceData = async (timeframe: string) => {
  const response = await fetch(`/api/get-prices?type=chart&timeframe=${timeframe}`);
  if (!response.ok) throw new Error('API down');
  return response.json();
};

export const fetchWeeklyMarketReport = async () => {
  const response = await fetch(`/api/get-prices?type=report`);
  if (!response.ok) throw new Error('API down');
  return response.json();
};
