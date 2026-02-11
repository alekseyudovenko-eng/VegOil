import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MarketReport as MarketReportType } from '../types';

interface MarketReportProps {
  report: MarketReportType | null;
  isLoading: boolean;
  sources?: any[];
}

const MarketReport: React.FC<MarketReportProps> = ({ report, isLoading, sources }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  // Если отчета нет или это не строка — ничего не рендерим
  if (!report || typeof report !== 'string') return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1.01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Аналитический отчет
        </h2>
      </div>
      
      {/* ГЛАВНЫЙ БЛОК: Рендерим Markdown */}
      <div className="p-6">
        <div className="prose prose-blue max-w-none 
          prose-headings:font-bold prose-headings:text-gray-900
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-table:border prose-table:border-gray-200 
          prose-th:bg-gray-50 prose-th:p-2 prose-th:border
          prose-td:p-2 prose-td:border prose-td:text-sm">
          
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>

        {/* Ссылки на источники */}
        {sources && sources.length > 0 && (
          <section className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Источники данных</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" 
                   className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors">
                  {src.title || 'Источник'}
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
