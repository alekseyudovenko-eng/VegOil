import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader';
import PriceChart from './components/PriceChart';

function App() {
  const [marketData, setMarketData] = useState({
    prices: [],
    analysis: '',
    news: [],
    trend: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/get-prices');
      if (!response.ok) throw new Error('Ошибка сервера');
      const data = await response.json();
      
      if (data.prices) {
        setMarketData(data);
      } else {
        throw new Error('Данные не найдены');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const priceInfo = useMemo(() => {
    const p = marketData.prices;
    if (!p || p.length < 2) return undefined;
    const last = p[p.length - 1];
    const prev = p[p.length - 2];
    return {
      price: last.close,
      change: last.close - prev.close,
      changePercent: ((last.close - prev.close) / prev.close) * 100
    };
  }, [marketData.prices]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-8 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Шапка (используй исправленную версию с защитой ?) */}
        <DashboardHeader 
          priceInfo={priceInfo} 
          isLoading={loading} 
          onRefresh={loadData} 
        />

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm">
            ⚠️ {error}. Проверьте TAVILY_API_KEY и VITE_GROQ_API_KEY.
          </div>
        )}

        {/* График только за 7 дней */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold">7-Day Price Movement</h2>
              <p className="text-sm text-slate-400">January 23 - January 29, 2026</p>
            </div>
            <div className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest">
              Live Data
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center animate-pulse text-slate-300 italic">
                Анализируем источники (Star, NST, Agropost)...
              </div>
            ) : (
              <PriceChart data={marketData.prices} />
            )}
          </div>
        </div>

        {/* Аналитика и Новости */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold text-blue-600 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
              Market Analysis
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {marketData.analysis || "Сбор аналитических данных..."}
            </p>
            <div className="pt-4 border-t border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current Trend</span>
              <div className={`text-xl font-black ${marketData.trend?.toLowerCase().includes('bull') ? 'text-green-600' : 'text-red-600'}`}>
                {marketData.trend || 'Detecting...'}
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 italic underline decoration-blue-200">Latest Headlines</h3>
            <ul className="space-y-4">
              {marketData.news.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 flex gap-3 leading-snug">
                  <span className="text-blue-500 font-bold">{i+1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
