import React, { useState, useEffect, useCallback } from 'react';
import PriceChart from './components/PriceChart';
import { MarketReport } from './components/MarketReport';
import { fetchRealtimePriceData, fetchWeeklyMarketReport } from './services/priceService';

function App() {
  const [activeTimeframe, setActiveTimeframe] = useState<any>('1M');
  const [priceData, setPriceData] = useState<any[]>([]);
  const [marketReport, setMarketReport] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setIsReportLoading(true);
    try {
      // Выполняем запросы. Даже если один упадет, второй может выжить.
      const chartRes = await fetchRealtimePriceData(activeTimeframe).catch(err => {
        console.error("Chart Fetch Error:", err);
        return { data: [] };
      });
      
      const reportRes = await fetchWeeklyMarketReport().catch(err => {
        console.error("Report Fetch Error:", err);
        return { report: null, sources: [] };
      });

      setPriceData(chartRes.data || []);
      setMarketReport(reportRes.report || null);
      setSources(reportRes.sources || []);
    } catch (err) {
      console.error("Global Dashboard Error:", err);
    } finally {
      setIsLoading(false);
      setIsReportLoading(false);
    }
  }, [activeTimeframe]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Palm Oil Intelligence</h1>
            <p className="text-gray-500">РФ Сессия (через VPN/Vercel Edge)</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
            {['1W', '1M', '3M', '1Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeTimeframe === tf 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Динамика цен (FCPO)</h2>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded animate-pulse">
                  Загрузка данных с сервера...
                </div>
              ) : (
                <PriceChart data={priceData} />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {/* Передаем данные в MarketReport. Пропсы должны совпадать! */}
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
