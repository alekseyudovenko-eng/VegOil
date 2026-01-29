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
    } catch (e) { console.error("Data fetch failed", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const priceInfo = useMemo(() => {
    if (!report?.prices || report.prices.length < 2) return undefined;
    const p = report.prices;
    const last = p[p.length - 1];
    const prev = p[p.length - 2];
    return {
      price: Math.round(last.close),
      change: Math.round(last.close - prev.close),
      changePercent: Number(((last.close - prev.close) / prev.close * 100).toFixed(2))
    };
  }, [report]);

  if (loading && !report) return (
    <div className="h-screen flex items-center justify-center bg-white italic text-slate-400">
      Syncing Intelligence Channels...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <DashboardHeader priceInfo={priceInfo} isLoading={loading} onRefresh={loadData} />

        {/* Раздел 1: Executive Summary */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black mb-4 text-blue-600 uppercase tracking-[0.3em]">Executive Summary</h2>
          <p className="text-xl font-medium text-slate-800 leading-snug">
            {report?.summary}
          </p>
        </section>

        {/* Раздел 2: Market Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="h-[300px] w-full">
            {report?.prices?.length > 0 && (
              <PriceChart data={report.prices} key={report.prices.length} />
            )}
          </div>
        </div>

        {/* Раздел 3: Top News by Commodity */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {report?.topNews && Object.entries(report.topNews).map(([commodity, news]: any) => (
            <div key={commodity} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
              <h4 className="text-[9px] font-black text-slate-400 uppercase mb-2">{commodity}</h4>
              <p className="text-[11px] text-slate-600 leading-tight line-clamp-4">{news}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Раздел 4: Regulatory */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem]">
            <h3 className="text-sm font-bold mb-4 uppercase text-yellow-500">Regulatory Updates</h3>
            <ul className="space-y-3">
              {report?.policy?.map((p: string, i: number) => (
                <li key={i} className="text-xs opacity-70 border-l border-white/20 pl-4">{p}</li>
              ))}
            </ul>
          </div>

          {/* Раздел 5: Trends */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
            <h3 className="text-sm font-bold mb-4 uppercase text-slate-400">Market Trend Analysis</h3>
            <div className="space-y-2">
              {report?.trends && Object.entries(report.trends).map(([c, t]: any) => (
                <div key={c} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-700">{c}</span>
                  <span className={`text-[10px] font-black uppercase ${t === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
