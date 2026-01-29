import React, { useState, useEffect } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { PriceChart } from './components/PriceChart';
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
      if (result.data.length > 0) {
        setPriceData(result.data);
      } else {
        setError(true);
      }
    } catch (e) {
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
      <DashboardHeader 
        onRefresh={loadData} 
        loading={loading}
      />
      
      <main className="max-w-7xl mx-auto mt-8">
        <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">FCPO Futures (Bursa Malaysia)</h2>
            <div className="flex gap-2">
              {(['1W', '1M', '3M'] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-1 rounded ${timeframe === t ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center italic text-slate-400">
              Получение реальных данных через OpenRouter...
            </div>
          ) : error ? (
            <div className="h-80 flex flex-col items-center justify-center text-red-400">
              <span>Данные не найдены.</span>
              <span className="text-sm opacity-50">Проверьте ключ API или VPN (OpenRouter/Groq блокируют РФ).</span>
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
