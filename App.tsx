import React, { useState, useEffect, useCallback } from 'react';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-prices');
      const result = await response.json();
      setData(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading && !data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-mono uppercase tracking-[0.3em]">
      Syncing Eurasia Intelligence...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Market Intelligence</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vegetable Oils & Fats • Jan 29, 2026</p>
          </div>
          <button onClick={loadData} className="p-3 bg-white border rounded-full shadow-sm hover:shadow-md transition-all">🔄</button>
        </header>

        {/* Executive Summary */}
        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Executive Summary</h2>
          <p className="text-xl font-bold text-slate-800 leading-tight">{data?.executive_summary}</p>
        </section>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.top_news && Object.entries(data.top_news).map(([product, news]: any) => (
            <div key={product} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product}</h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${data.trends?.[product] === 'Bullish' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {data.trends?.[product]}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug">{news}</p>
            </div>
          ))}
        </div>

        {/* Regional Update */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem]">
          <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-yellow-500">Regional Insights (Europe / CIS / Caucasus)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data?.regional_analysis?.map((reg: any, i: number) => (
              <div key={i} className="border-l border-white/20 pl-4">
                <h4 className="text-[10px] font-bold text-white uppercase mb-2">{reg.region}</h4>
                <p className="text-xs opacity-70 leading-relaxed">{reg.update}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center py-8 opacity-20 text-[9px] uppercase tracking-[0.5em]">
          Eurasia Edible Oils Hub • Real-time Data Sync
        </footer>
      </div>
    </div>
  );
}

export default App;
