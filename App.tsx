import React, { useEffect, useState } from 'react';

interface Section {
  title: string;
  content: string;
}

const App: React.FC = () => {
  const [reportData, setReportData] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-prices')
      .then(res => res.json())
      .then(data => {
        const rawText = data.report || '';
        const sections = rawText.split('##').filter(Boolean).map(s => {
          const lines = s.trim().split('\n');
          const cleanTitle = lines[0].replace(/[#*]/g, '').trim();
          const cleanContent = lines.slice(1).join('\n').replace(/[#*]/g, '').trim();
          return { title: cleanTitle, content: cleanContent };
        });
        setReportData(sections);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 p-4 md:p-8 font-sans selection:bg-emerald-500/30 text-left">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Terminal<span className="text-emerald-500">.</span></h1>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-[0.5em]">Global Commodity Intelligence</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">System Status</p>
            <p className="text-xs text-emerald-400 font-mono flex items-center gap-2 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Data Sync Active
            </p>
          </div>
        </div>

        {/* CHART PLACEHOLDER (Заглушка) */}
        <div className="h-48 w-full bg-[#0d0d0d] rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          {/* Декоративная сетка на фоне */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', size: '20px 20px', backgroundSize: '30px 30px' }}>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="text-emerald-500/50 mb-2 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">
              Status: Visualization Standby
            </div>
            <h2 className="text-white/20 font-bold text-xl tracking-widest uppercase">
              Chart Module Initializing<span className="animate-bounce">...</span>
            </h2>
            <p className="text-slate-700 text-[9px] mt-2 uppercase tracking-widest font-mono">
              Waiting for high-frequency settlement data
            </p>
          </div>
        </div>

        {/* ANALYTICS REPORT */}
        <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center py-32 space-y-6">
              <div className="w-10 h-10 border border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">Processing Market Context...</p>
            </div>
          ) : (
            reportData.map((section, idx) => (
              <div key={idx} className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden transition-all hover:bg-[#0f0f0f] hover:border-white/10 shadow-xl">
                <div className="px-8 py-5 bg-white/[0.01] border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-emerald-500 font-bold text-xs uppercase tracking-[0.2em]">{section.title}</h3>
                  <span className="text-[10px
