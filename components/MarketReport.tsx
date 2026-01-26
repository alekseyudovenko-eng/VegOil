
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

  if (!report) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Market Intelligence Report: Vegetable Oils & Fats
        </h2>
      </div>
      
      <div className="p-6 space-y-10">
        {/* Summary */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</h3>
          <p className="text-gray-700 leading-relaxed text-lg">{report.summary}</p>
        </section>

        {/* Top Commodity News */}
        {report.topNews && report.topNews.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Top News by Commodity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.topNews.map((news, i) => (
                <div key={i} className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                  </div>
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

        {/* Regulatory Updates - MOVED UP */}
        {report.policyUpdates && report.policyUpdates.length > 0 && (
          <section className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Regulatory & Policy Updates
            </h3>
            <div className="space-y-4">
              {report.policyUpdates.map((update, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-24 font-bold text-xs text-yellow-700 uppercase pt-0.5">
                    {update.country}
                  </div>
                  <p className="text-sm text-yellow-900 leading-relaxed">
                    {update.update}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Price Trends */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Market Trend Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.priceTrends.map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-900">{item.commodity}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      item.trend === 'up' ? 'bg-red-50 text-brand-red' : 
                      item.trend === 'down' ? 'bg-green-50 text-brand-green' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {item.trend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trade Flows Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Trade Flows & Production</h3>
            <span className="text-[10px] text-gray-400 italic">Target Countries Data Integration</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-bold text-gray-600">Region/Country</th>
                  <th className="px-4 py-3 font-bold text-gray-600">Commodity</th>
                  <th className="px-4 py-3 font-bold text-gray-600">Volume Category</th>
                  <th className="px-4 py-3 font-bold text-gray-600">Volume Estimate</th>
                  <th className="px-4 py-3 font-bold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.tradeTable.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.country}</td>
                    <td className="px-4 py-3 text-gray-600">{row.commodity}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-500 italic bg-gray-100 px-2 py-0.5 rounded">
                        {row.volumeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{row.volume}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-[10px] bg-blue-50 text-brand-blue font-bold uppercase whitespace-nowrap">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MarketReport;
