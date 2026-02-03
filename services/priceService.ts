import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

// Запрос ТОЛЬКО для графика
export const fetchRealtimePriceData = async (timeframe: string) => {
  const response = await fetch(`/api/get-prices?type=chart&timeframe=${timeframe}`);
  if (!response.ok) throw new Error('Chart data fetch failed');
  return await response.json(); 
};

// Запрос ТОЛЬКО для отчета Market Intelligence
export const fetchWeeklyMarketReport = async () => {
  const response = await fetch(`/api/get-prices?type=report`);
  if (!response.ok) throw new Error('Market report fetch failed');
  return await response.json();
};
