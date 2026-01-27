import React from 'react';
import type { MarketReport as MarketReportType } from '../types';

interface MarketReportProps {
  report: MarketReportType | null;
  isLoading: boolean;
}

const MarketReport: React.FC<MarketReportProps> = ({ report, isLoading }) => {
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

  // Если отчета нет или он пустой объект
  if (!report || Object.keys(report).length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1.01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Market Intelligence Report: Vegetable Oils & Fats
        </h2>
      </div>
      
      <div className="p-6 space-y-10">
        {/* Summary */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</h3>
          <p className="text-gray-700 leading-relaxed text-lg">{report.summary || "No summary available"}</p>
        </section>

        {/* Top Commodity News - ЗАЩИЩЕНО */}
        {Array.isArray(report.topNews) && report.topNews.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Top News by Commodity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.topNews.map((news, i) => (
                <div key={i} className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 relative overflow-hidden">
                  <div className="inline-block px-2 py-0.5 rounded bg-brand-blue text-white text-[10px] font-bold uppercase mb-2">
                    {news.commodity}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 leading-snug">{news.headline}</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{news.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regulatory Updates - ЗАЩИЩЕНО */}
        {Array.isArray(report.policyUpdates) && report.policyUpdates.length > 0 && (
          <section className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              Regulatory & Policy Updates
            </h3>
            <div className="space-y-4">
              {report.policyUpdates.map((update, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-24 font-bold text-xs text-yellow-700 uppercase pt-0.5">
                    {update.country}
                  </div>
                  <p className="text-sm text-yellow-900 leading-relaxed">{update.update}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Price Trends - ЗАЩИЩЕНО */}
        {Array.isArray(report.priceTrends) && report.priceTrends.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Market Trend Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.priceTrends.map((item, i) => (
                <div key={i} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-900">{item.commodity}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      item.trend === 'up' ? 'bg-red-50 text-brand-red' : 'bg-green-50 text-brand-green'
                    }`}>
                      {item.trend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trade Flows Table - ЗАЩИЩЕНО */}
        {Array.isArray(report.tradeTable) && report.tradeTable.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Trade Flows & Production</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-bold text-gray-600">Region/Country</th>
                    <th className="px-4 py-3 font-bold text-gray-600">Commodity</th>
                    <th className="px-4 py-3 font-bold text-gray-600">Volume</th>
                    <th className="px-4 py-3 font-bold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.tradeTable.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.country}</td>
                      <td className="px-4 py-3 text-gray-600">{row.commodity}</td>
                      <td className="px-4 py-3 font-mono">{row.volume}</td>
                      <td className="px-4 py-3 font-bold text-[10px] text-brand-blue uppercase">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MarketReport;
