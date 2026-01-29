import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardHeader from './components/DashboardHeader';
import PriceChart from './components/PriceChart';
import { fetchRealtimePriceData } from './services/priceService';

function App() {
  const [timeframe, setTimeframe] = useState('1M');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await fetchRealtimePriceData(timeframe);
    setPriceData(result.data || []);
    setLoading(false);
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const priceInfo = useMemo(() => {
    if (!priceData || priceData.length < 2) return undefined;
    const last = priceData[priceData.length - 1];
    const prev = priceData[priceData.length - 2];
    return {
      price: last.close,
      change: last.close - prev.close,
      changePercent: ((last.close - prev.close) / prev.close) * 100
    };
  }, [priceData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader 
          priceInfo={priceInfo} 
          isLoading={loading} 
          onRefresh={loadData} 
        />
        
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800">График цен FCPO</h2>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {['1W', '1M', '3M'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                    timeframe === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] flex items-center justify-center">
            {loading ? (
              <p className="animate-pulse text-gray-400">Загрузка данных через прокси Vercel...</p>
            ) : priceData.length > 0 ? (
              <PriceChart data={priceData} />
            ) : (
              <p className="text-red-400">Данные не найдены. Проверьте логи API в Vercel.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
