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
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Gathering Intelligence...</p>
        <p className="text-xs text-slate-300 mt-2">Europe • CIS • Central Asia</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Market Intelligence</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vegetable Oils & Fats • Jan 29, 2026</p>
          </div>
          <button onClick={loadData} className="p-2 bg-white border rounded-full shadow-sm hover:bg-slate-50 transition-colors">🔄</button>
        </header>

        {/* Executive Summary */}
        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-xl font-bold text-slate-800 leading-tight">
            {data?.executive_summary}
          </p>
        </section>

        {/* Top News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.top_news && Object.entries(data.top_news).map(([product, news]: any) => (
            <div key={product} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[9px] font-black text-blue-500 uppercase mb-2 tracking-widest">{product}</h3>
              <p className="text-xs font-medium text-slate-600 leading-normal">{news}</p>
              <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase ${data.trends?.[product] === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>
                  {data.trends?.[product] || 'Neutral'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Regional Updates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-slate-900 text-white p-8 rounded-[2.5rem]">
            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-yellow-500">Regional Intelligence</h2>
            <div className="space-y-6">
              {data?.regional_updates?.map((reg: any, i: number) => (
                <div key={i} className="border-l border-white/20 pl-4">
                  <h4 className="text-[10px] font-bold text-white uppercase mb-1">{reg.region}</h4>
                  <p className="text-xs opacity-70 leading-relaxed">{reg.update}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
            <h2 className="text-sm font-black mb-4 uppercase tracking-widest">Market Scope</h2>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2">🟢 EU-27 Market Analysis</li>
              <li className="flex items-center gap-2">🟢 Russia & Ukraine Export Data</li>
              <li className="flex items-center gap-2">🟢 Central Asia Logistics</li>
              <li className="flex items-center gap-2">🟢 Caucasus Regional Trends</li>
            </ul>
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 leading-relaxed">
              Report generated on 2026-01-29 using real-time search via Tavily & Llama 3.3.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
