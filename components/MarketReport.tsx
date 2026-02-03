import React from 'react';
import type { MarketReport as MarketReportType } from '../types';

// 1. СНАЧАЛА ИНТЕРФЕЙС
interface MarketReportProps {
  report: MarketReportType | null;
  isLoading: boolean;
  sources?: any[]; // Теперь это здесь и билд не упадет
}

// 2. ПОТОМ КОМПОНЕНТ
const MarketReport: React.FC<MarketReportProps> = ({ report, isLoading, sources }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!report || Object.keys(report).length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1.01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Market Intelligence Report
        </h2>
      </div>
      
      <div className="p-6 space-y-10">
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</h3>
          <p className="text-gray-700 leading-relaxed text-lg">{report.summary || "No summary available"}</p>
        </section>

        {/* Твой код для новостей, трендов и таблицы остается без изменений... */}
        {/* ... (оставляй как было в твоем файле) ... */}

        {/* Дополнительно: можно вывести ссылки на источники в конце, раз мы их передаем */}
        {sources && sources.length > 0 && (
          <section className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Sources</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" 
                   className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors">
                  {src.title || 'Source'}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MarketReport;
