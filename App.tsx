import React, { useState, useEffect } from 'react';
// Убираем фигурные скобки, если компоненты экспортированы как 'export default'
import DashboardHeader from './components/DashboardHeader';
import PriceChart from './components/PriceChart';
import { fetchRealtimePriceData } from './services/priceService';
import { Timeframe, PriceData } from './types';

function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchRealtimePriceData(timeframe);
      if (result.data && result.data.length > 0) {
        setPriceData(result.data);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error("Load Error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeframe]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Проверь пропсы DashboardHeader, если билд снова ругнется на типы */}
      <DashboardHeader 
        onRefresh={loadData} 
        loading={loading}
      />
      
      <main className="max-w-7xl mx-auto mt-8">
        <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-blue-400">FCPO Futures (Bursa Malaysia)</h2>
            <div className="flex gap-2">
              {(['1W', '1M', '3M'] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-1 rounded transition-colors ${
                    timeframe === t 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-slate-400 italic">Получение данных из OpenRouter (Bursa Malaysia)...</div>
            </div>
          ) : error ? (
            <div className="h-80 flex flex-col items-center justify-center text-center p-4">
              <div className="text-red-400 mb-2 font-semibold text-lg">⚠️ Реальные данные не получены</div>
              <p className="text-slate-400 text-sm max-w-md">
                Проверьте VPN (запросы к OpenRouter блокируются в РФ) и наличие ключа в Vercel.
              </p>
              <button 
                onClick={loadData}
                className="mt-4 text-blue-400 hover:underline"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <PriceChart data={priceData} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
