
import React from 'react';

interface PriceInfo {
  price: number;
  change: number;
  changePercent: number;
}

interface DashboardHeaderProps {
  priceInfo: PriceInfo;
  isLoading: boolean;
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-gray-200 animate-pulse rounded-md ${className}`}></div>
);

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ priceInfo, isLoading, onRefresh }) => {
  const isPositive = priceInfo.change >= 0;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Crude Palm Oil Futures (FCPO)
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-brand-green border border-green-200 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
            Live
          </div>
        </div>
        <p className="text-gray-500 mt-1 flex items-center gap-2">
          Bursa Malaysia Derivatives (BMD)
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          Real-time Market Data
        </p>
      </div>
      <div className="flex items-center gap-6 mt-4 sm:mt-0">
         {isLoading ? (
          <div className="text-right">
            <SkeletonLoader className="h-8 w-40 mb-2" />
            <SkeletonLoader className="h-6 w-32" />
          </div>
        ) : (
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 font-mono">
              {formatCurrency(priceInfo.price)}
            </p>
            <p className={`text-lg font-bold ${isPositive ? 'text-brand-green' : 'text-brand-red'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(priceInfo.change).toFixed(2)} ({isPositive ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%)
            </p>
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-brand-blue hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50 transition-all active:scale-95"
          aria-label="Refresh data"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
