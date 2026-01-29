import React, { useState, useEffect, useCallback } from 'react';
// Импортируем компоненты как default, чтобы избежать ошибок билда
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
      console.log(`Запуск загрузки данных для таймфрейма: ${timeframe}`);
      const result = await fetchRealtimePriceData(timeframe);
      
      if (result && result.data && result.data.length > 0) {
        console.log("Данные успешно получены:", result.data);
        setPriceData(result.data);
      } else {
        console.warn("Сервис вернул пустой массив данных.");
        setError("Реальные данные не найдены. Попробуйте обновить страницу с включенным VPN.");
      }
    } catch (e: any) {
      console.error("Ошибка в App.tsx при загрузке:", e);
      setError(e.message || "Произошла ошибка при получении данных.");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      {/* Шапка с кнопкой обновления */}
      <DashboardHeader 
        onRefresh={loadData} 
        loading={loading}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-2xl border border-slate-700/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                FCPO Futures Prices
              </h2>
              <p className="text-slate-400 text-sm mt-1">Bursa Malaysia • Real-time via OpenRouter</p>
            </div>
            
            {/* Переключатель таймфреймов */}
            <div className="flex bg-[#0f172a] p-1 rounded-lg border border-slate-700">
              {(['1W', '1M', '3M'] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    timeframe === t 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Основная область контента */}
          <div className="relative min-h-[400px] w-full bg-[#0f172a]/50 rounded-xl border border-slate-800 flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 animate-pulse italic">Поиск актуальных котировок...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-white mb-2">{error}</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md">
                  Для работы OpenRouter (модели Perplexity Sonar) в РФ требуется стабильный VPN. 
                  Также убедитесь, что ключ API добавлен в переменные Vercel.
                </p>
                <button 
                  onClick={loadData}
                  className="px-8 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors"
                >
                  Повторить запрос
                </button>
              </div>
            ) : (
              // Рендерим график только если есть данные, чтобы избежать ошибки .change
              <div className="w-full h-full p-2">
                <PriceChart data={priceData} />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              System Live
            </div>
            <div>Source: Perplexity Llama 3.1 Sonar</div>
            <div className="ml-auto">Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
