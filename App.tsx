import React, { useState, useEffect, useCallback } from 'react';
import TradingViewWidget from './components/TradingViewWidget'; // Наш новый герой
import MarketReport from './components/MarketReport';
import { fetchRealtimePriceData, fetchWeeklyMarketReport } from './services/priceService';

function App() {
  const [activeTimeframe, setActiveTimeframe] = useState<any>('1M');
  const [marketReport, setMarketReport] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsReportLoading(true);
    try {
      // Подгружаем отчет и источники через твой API
      const reportRes = await fetchWeeklyMarketReport().catch(err => {
        console.error("Report Fetch Error:", err);
        return { report: null, sources: [] };
      });

      setMarketReport(reportRes.report || null);
      setSources(reportRes.sources || []);
    } catch (err) {
      console.error("Global Dashboard Error:", err);
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Palm Oil Intelligence</h1>
            <p className="text-gray-500 font-medium">РФ Сессия (Vercel Edge + Live MYX Data)</p>
          </div>
          
          {/* Таймфреймы для виджета (опционально, т.к. в виджете есть свои) */}
          <div className="hidden md:flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
            {['1D', '1W', '1M', 'ALL'].map((tf) => (
              <button
                key={tf}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all"
              >
                {tf}
              </button>
            ))}
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ЛЕВАЯ КОЛОНКА: Виджет TradingView */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Bursa Malaysia: FCPO Real-Time Chart
                </h2>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">Live MYX</span>
              </div>
              
              <div style={{ height: '540px', width: '100%' }}>
                <TradingViewWidget />
              </div>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ИИ Отчет и Новости */}
          <div className="lg:col-span-1">
            <MarketReport 
              report={marketReport} 
              isLoading={isReportLoading} 
              sources={sources} 
            />
          </div>
          
        </main>
      </div>
    </div>
  );
}

export default App;
