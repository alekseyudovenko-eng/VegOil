
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface MarketReport {
  summary: string;
  topNews: { commodity: string; headline: string; content: string }[];
  priceTrends: { commodity: string; trend: 'up' | 'down' | 'stable'; details: string }[];
  regionalHighlights: { region: string; events: string }[];
  tradeTable: { country: string; commodity: string; volume: string; volumeType: string; status: string }[];
  policyUpdates: { country: string; update: string }[];
}

export type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y';

/**
 * Fix: Added ComparisonOption export which was missing but required by mockPriceService.ts
 */
export type ComparisonOption = 'NONE' | 'SBO' | 'PREVIOUS_PERIOD';

/**
 * Fix: Updated MergedPriceData to include optional comparisonClose as used in PriceChart.tsx logic
 */
export interface MergedPriceData extends PriceData {
  comparisonClose?: number;
}
