// types.ts

export interface Source {
  title: string;
  url: string;
}

export interface MarketReport {
  // Мы делаем это объединением, чтобы поддерживать и простую строку, 
  // и структурированный объект, если ты решишь усложнить бэкенд позже.
  content: string;
  timestamp?: string;
  region?: string;
  topic?: string;
}

// Добавим вспомогательный тип для состояния нашего терминала
export type Region = 'Russia & CIS' | 'Central Asia' | 'Europe' | 'Global';

export type TopicId = 'news' | 'trade' | 'policy' | 'prices';

export interface Topic {
  id: TopicId;
  label: string;
}

export interface ApiResponse {
  report: string; // То, что приходит из нашего get-prices.js
  sources?: Source[];
  error?: string;
}
