import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  try {
    const response = await fetch(`/api/get-prices?type=chart&timeframe=${timeframe}`);
    const result = await response.json();
    return {
      data: result.data || [],
      sources: result.sources || [],
      isFallback: result.isFallback || false
    };
  } catch (error) {
    console.error("Error fetching prices:", error);
    return { data: [], sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport, sources: GroundingSource[], isFallback: boolean }> => {
  try {
    const response = await fetch('/api/get-prices?type=report');
    const result = await response.json();
    return {
      report: result.report || null,
      sources: result.sources || [],
      isFallback: result.isFallback || false
    };
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};
