import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader';
import PriceChart from './components/PriceChart';

function App() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-prices');
      const data = await response.json();
      setReport(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const priceInfo = useMemo(() => {
    if (!report?.prices || report.prices.length < 2) return undefined;
    const p = report.prices;
    const last = p[p.length - 1];
    const prev = p[p.length - 2];
    // Округляем до целых для Header
    return {
      price: Math.round(last.close),
      change: Math.round(last.close - prev.close),
      changePercent: Number(((last.close - prev.close) / prev.close * 100).toFixed(2))
    };
  }, [report]);

  if (loading && !report) return <div className="h-screen flex items-center justify-center bg-slate-50 animate-pulse font-bold text-slate-400">Generatig Intelligence Report...</div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <DashboardHeader priceInfo={priceInfo} isLoading={loading} onRefresh={loadData} />

        {/* 1. Executive Summary */}
        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black mb-4 text-slate-800 uppercase tracking-tight">Executive Summary</h2>
          <p className="text-slate-600 leading-relaxed text-lg italic">"{report?.summary}"</p>
        </section>

        {/* 2. Chart Section (Rounded Data) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">FCPO 7-Day Price Action (MYR)</h2>
          <div className="h-[300px]">
             <PriceChart data={report?.prices || []} />
          </div>
        </div>

        {/* 3. Top News by Commodity */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2">Top News by Commodity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report?.topNews && Object.entries(report.topNews).map(([commodity, news]: any) => (
              <div key={commodity} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-blue-500 uppercase">{commodity}</span>
                <p className="text-sm mt-2 text-slate-700 leading-snug">{news || "No significant updates for this period."}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 4. Regulatory & Policy */}
          <section className="bg-slate-800 text-white p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              Regulatory & Policy Updates
            </h2>
            <ul className="space-y-4">
              {report?.policy?.map((item: string, i: number) => (
                <li key={i} className="text-sm text-slate-300 border-l-2 border-yellow-400 pl-4 py-1">{item}</li>
              ))}
            </ul>
          </section>

          {/* 5. Market Trend Analysis */}
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Market Trend Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              {report?.trends && Object.entries(report.trends).map(([comm, trend]: any) => (
                <div key={comm} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">{comm}</span>
                  <span className={`text-xs font-black uppercase ${trend === 'Bullish' ? 'text-green-600' : trend === 'Bearish' ? 'text-red-600' : 'text-slate-400'}`}>
                    {trend}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="py-10 text-center text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          Internal Intelligence Report • January 29, 2026 • Confidential
        </footer>
      </div>
    </div>
  );
}

export default App;
