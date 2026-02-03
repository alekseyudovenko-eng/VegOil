import React, { useState, useEffect, useCallback } from 'react';
import { PriceChart } from './components/PriceChart';
import { MarketReport } from './components/MarketReport';
import { fetchRealtimePriceData, fetchWeeklyMarketReport } from './services/priceService';
import { Timeframe, PriceData, MarketReport as MarketReportType } from './types';

function App() {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1M');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [marketReport, setMarketReport] = useState<MarketReportType | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Загрузка данных для ГРАФИКА
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const chartRes = await fetchRealtimePriceData(activeTimeframe);
      setPriceData(chartRes.data || []);
    } catch (e) {
      console.error("Chart Error:", e);
      setError("Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  }, [activeTimeframe]);

  // 2. Загрузка данных для ОТЧЕТА (Market Intelligence)
  const loadReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      const reportRes = await fetchWeeklyMarketReport();
      // Проверяем структуру ответа, чтобы не упасть
      setMarketReport(reportRes.report || null);
      setSources(reportRes.sources || []);
    } catch (e) {
      console.error("Report Error:", e);
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  // 3. Запуск загрузки при старте и смене таймфрейма
  useEffect(() => {
    loadData();
    loadReport();
  }, [loadData, loadReport]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Palm Oil Intelligence</h1>
            <p className="text-gray-500">Real-time market analysis and price tracking</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border">
            {(['1W', '1M', '3M', '1Y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTimeframe === tf 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Секция ГРАФИКА */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Price Dynamics (FCPO)</h2>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
                  <span className="text-gray-400 animate-pulse">Loading market data...</span>
                </div>
              ) : error ? (
                <div className="h-[400px] flex items-center justify-center text-red-500 bg-red-50 rounded">
                  {error}
                </div>
              ) : (
                <PriceChart data={priceData} />
              )}
            </div>
          </div>

          {/* Секция ИНТЕЛЛЕКТА */}
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
