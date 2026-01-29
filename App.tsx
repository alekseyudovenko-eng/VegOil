import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader';
import PriceChart from './components/PriceChart';
import { fetchRealtimePriceData } from './services/priceService';
import { Timeframe, PriceData } from './types';

function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Запрос данных через OpenRouter...");
      const result = await fetchRealtimePriceData(timeframe);
      
      if (result && result.data && result.data.length > 0) {
        // Сортируем данные по дате на всякий случай
        const sortedData = [...result.data].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setPriceData(sortedData);
      } else {
        setError("Реальные данные не найдены. Проверьте VPN.");
      }
    } catch (e: any) {
      console.error("Критическая ошибка App:", e);
      setError("Ошибка соединения с API OpenRouter.");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Вычисляем данные для DashboardHeader на основе полученного массива
  const priceInfo = useMemo(() => {
    if (priceData.length === 0) return undefined;

    const last = priceData[priceData.length - 1];
    const prev = priceData[priceData.length - 2] || last;
    
    const change = last.close - prev.close;
    const changePercent = prev.close !== 0 ? (change / prev.close) * 100 : 0;

    return {
      price: last.close,
      change: change,
      changePercent: changePercent
    };
  }, [priceData]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Шапка с защищенными данными */}
        <DashboardHeader 
          priceInfo={priceInfo} 
          isLoading={loading} 
          onRefresh={loadData} 
        />
        
        <main className="mt-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-xl font-bold text-gray-800">Обзор рынка (Bursa Malaysia)</h2>
              
              {/* Переключатель периодов */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(['1W', '1M', '3M'] as Timeframe[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      timeframe === t 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Сетка графика */}
            <div className="min-h-[450px] w-full flex items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-sm italic">Ищем котировки через Sonar...</p>
                </div>
              ) : error ? (
                <div className="text-center">
                  <p className="text-red-500 font-medium mb-2">{error}</p>
                  <button 
                    onClick={loadData}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Попробовать еще раз
                  </button>
                </div>
              ) : (
                <div className="w-full h-[450px]">
                  <PriceChart data={priceData} />
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-8 text-center text-gray-400 text-xs">
          <p>Данные предоставлены OpenRouter / Perplexity Sonar. Требуется VPN для работы из РФ.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
