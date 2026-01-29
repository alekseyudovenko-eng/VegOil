import React, { useState, useEffect, useCallback } from 'react';
import DashboardHeader from './components/DashboardHeader';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-prices'); // Оставляем тот же эндпоинт, но код в нем новый
      const result = await response.json();
      setData(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading && !data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-mono uppercase tracking-[0.3em]">
      Loading Intelligence Report...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <DashboardHeader isLoading={loading} onRefresh={loadData} />

        {/* Executive Summary */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 italic">Executive Summary (Jan 29, 2026)</h2>
          <p className="text-2xl font-bold leading-tight text-slate-800">
            {data?.executive_summary}
          </p>
        </section>

        {/* Top News by Product */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.top_news && Object.entries(data.top_news).map(([product, news]: any) => (
            <div key={product} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{product}</h3>
                <p className="text-sm font-medium text-slate-700 leading-snug">{news}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Market Trend</span>
                <span className={`text-xs font-black uppercase ${data.trends?.[product] === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>
                  {data.trends?.[product]}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Regional Updates */}
          <section className="bg-slate-900 text-white p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
              Regional Intelligence
            </h2>
            <div className="space-y-6">
              {data?.regional_updates?.map((reg: any, i: number) => (
                <div key={i} className="border-l-2 border-white/10 pl-4 py-1">
                  <h4 className="text-xs font-bold text-yellow-400 uppercase mb-1">{reg.region}</h4>
                  <p className="text-sm opacity-80 leading-relaxed">{reg.update}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Policy & Focus (Fall-through block) */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Key Takeaways</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl">
                <p className="text-sm text-blue-800 font-medium">Мониторинг охватывает: ЕС, РФ, Украина, Казахстан, Узбекистан, Кавказский регион.</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                Аналитика сформирована на основе данных Bursa Malaysia, TradingView и региональных новостных агентств по состоянию на 29 января 2026 года.
              </p>
            </div>
          </section>
        </div>

        <footer className="text-center py-10 opacity-30 text-[9px] uppercase tracking-[0.5em]">
          Eurasia Edible Oils Intelligence • No Graph Mode • Active
        </footer>
      </div>
    </div>
  );
}

export default App;
