import React, { useState, useEffect, useCallback } from 'react';
import PriceChart from './components/PriceChart';
import MarketReport from './components/MarketReport';
import { fetchWeeklyMarketReport } from './services/priceService';

function App() {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [marketReport, setMarketReport] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWeeklyMarketReport();
      console.log("API Response:", res); // Посмотри это в консоли!

      // Проверяем все возможные места, где могут лежать данные
      const actualData = res.data || (res.report && res.report.data) || [];
      
      setPriceData(actualData);
      setMarketReport(res.report || res);
      setSources(res.sources || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Palm Oil Intelligence</h1>
          <p className="text-gray-500 font-medium italic">Custom Market Terminal (Data via Yahoo Finance / Investing)</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ГРАФИК */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">FCPO Price Trend (MYR)</h2>
                <button 
                  onClick={loadDashboard}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  Обновить данные
                </button>
              </div>
              
              {/* Контейнер с гарантированной высотой */}
              <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
                    <span className="animate-pulse text-gray-400 font-medium">Анализ рыночных данных...</span>
                  </div>
                ) : (
                  <PriceChart data={priceData} />
                )}
              </div>
            </div>
          </div>

          {/* ОТЧЕТ */}
          <div className="lg:col-span-1">
            <MarketReport 
              report={marketReport} 
              isLoading={isLoading} 
              sources={sources} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
