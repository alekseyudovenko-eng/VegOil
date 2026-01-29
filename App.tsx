import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader';
import PriceChart from './components/PriceChart';
import { fetchRealtimePriceData } from './services/priceService';

// Типы для нашего нового "умного" ответа
interface MarketState {
  prices: any[];
  analysis: string;
  news: string[];
  trend: string;
}

function App() {
  const [timeframe, setTimeframe] = useState('1M');
  const [marketData, setMarketData] = useState<MarketState>({
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
      // Запрос идет к нашему api/get-prices.js, который использует Tavily + Groq
      const response = await fetch(`/api/get-prices?timeframe=${timeframe}`);
      const result = await response.json();

      if (result.prices && result.prices.length > 0) {
        setMarketData({
          prices: result.prices,
          analysis: result.analysis || '',
          news: result.news || [],
          trend: result.trend || ''
        });
      } else {
        throw new Error(result.error || "Данные не найдены");
      }
    } catch (e: any) {
      console.error("Ошибка загрузки:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Вычисляем данные для шапки (теперь безопасно)
  const priceInfo = useMemo(() => {
    const data = marketData.prices;
    if (!data || data.length < 2) return undefined;

    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    
    return {
      price: last.close,
      change: last.close - prev.close,
      changePercent: ((last.close - prev.close) / prev.close) * 100
    };
  }, [marketData.prices]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Шапка с живыми данными */}
        <DashboardHeader 
          priceInfo={priceInfo} 
          isLoading={loading} 
          onRefresh={loadData} 
        />
        
        <main className="mt-8 space-y-6">
          {/* Блок Графика */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Market Chart</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {['1W', '1M', '3M'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      timeframe === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] w-full flex items-center justify-center">
              {loading ? (
                <div className="text-slate-400 italic animate-pulse">Поиск актуальных цен в сети...</div>
              ) : error ? (
                <div className="text-red-500 text-center">
                  <p>{error}</p>
                  <button onClick={loadData} className="text-blue-500 underline mt-2">Повторить</button>
                </div>
              ) : (
                <PriceChart data={marketData.prices} />
              )}
            </div>
          </div>

          {/* Блоки Аналитики и Новостей */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Анализ */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-blue-600 font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Market Analysis
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {marketData.analysis}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Trend</span>
                  <div className={`text-lg font-black ${marketData.trend?.toLowerCase().includes('bull') ? 'text-green-600' : 'text-red-600'}`}>
                    {marketData.trend || 'Neutral'}
                  </div>
                </div>
              </div>

              {/* Новости */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-slate-800 font-bold mb-3">Live Headlines</h3>
                <ul className="space-y-4">
                  {marketData.news.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest">
            Powered by Tavily Search & Groq Llama 3.3 • Data source: Bursa Malaysia
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
