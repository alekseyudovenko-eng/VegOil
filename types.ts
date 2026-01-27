export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Расширяем для графика, если нужно сравнение
export interface MergedPriceData extends PriceData {
  comparisonClose?: number;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface MarketReport {
  summary: string;
  topNews: { commodity: string; headline: string; content: string }[];
  priceTrends: { commodity: string; trend: 'up' | 'down' | 'stable' | 'neutral'; details: string }[];
  regionalHighlights?: { region: string; events: string }[];
  tradeTable: { country: string; commodity: string; volume: string; volumeType: string; status: string }[];
  policyUpdates: { country: string; update: string }[];
}

export type ComparisonOption = 'NONE' | 'SBO' | 'PREVIOUS_PERIOD';
