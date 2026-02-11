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
  url?: string; // Заменили uri на url, так как Tavily присылает url
}

// Наш новый упрощенный тип отчета
export type MarketReport = string;

export type ComparisonOption = 'NONE' | 'SBO' | 'PREVIOUS_PERIOD';
