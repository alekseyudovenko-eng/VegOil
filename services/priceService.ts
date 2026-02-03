import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const response = await fetch(`/api/get-prices?type=chart&timeframe=${timeframe}`);
  if (!response.ok) throw new Error('Network error');
  return response.json();
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport, sources: GroundingSource[], isFallback: boolean }> => {
  const response = await fetch('/api/get-prices?type=report');
  if (!response.ok) throw new Error('Network error');
  return response.json();
};
