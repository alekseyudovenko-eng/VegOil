import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarketReportProps {
  report: string | null; 
  isLoading: boolean;
  sources?: { title: string; url: string }[];
  title?: string;
}

const MarketReport: React.FC<MarketReportProps> = ({ report, isLoading, sources, title }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-blue-100 rounded-full animate-bounce"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all">
      {/* Заголовок отчета */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg 
            className="w-5 h-5 min-w-[20px] text-blue-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01 0 01.707.293l5.414 5.414a1 1.01 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          {title || 'Аналитический отчет'}
        </h2>
      </div>
      
      {/* Контент отчета */}
      <div className="p-6">
        <div className="prose prose-slate max-w-none 
          prose-headings:text-slate-900 prose-headings:font-bold
          prose-p:text-slate-700 prose-p:leading-relaxed
          prose-strong:text-blue-700
          prose-table:w-full prose-table:border-collapse
          prose-th:bg-slate-50 prose-th:p-3 prose-th:border prose-th:border-slate-200
          prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-td:text-sm">
          
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>

        {/* Секция источников */}
        {sources && sources.length > 0 && (
          <section className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Источники данных</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" 
                   className="text-[10px] bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-500 px-2 py-1 rounded border border-gray-100 transition-colors">
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
