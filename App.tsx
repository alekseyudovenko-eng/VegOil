import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [reportData, setReportData] = useState<{title: string, content: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-prices')
      .then(res => res.json())
      .then(data => {
        const rawText = data.report || '';
        
        // Разбиваем по решеткам, но очищаем их из заголовков сразу
        const sections = rawText.split('##').filter(Boolean).map(s => {
          const lines = s.trim().split('\n');
          // Очищаем заголовок от возможных остаточных символов
          const cleanTitle = lines[0].replace(/[#*]/g, '').trim();
          // Очищаем весь текст секции от звездочек и решеток
          const cleanContent = lines.slice(1).join('\n').replace(/[#*]/g, '').trim();
          
          return {
            title: cleanTitle,
            content: cleanContent
          };
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
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Live Data Feed
            </p>
          </div>
        </div>

        {/* CHART PLACEHOLDER */}
        <div className="relative group overflow-hidden bg-[#0d0d0d] border border-white/5 rounded-2xl p-12 flex items-center justify-center min-h-[350px] transition-all hover:border-emerald-500/20 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-center relative z-10">
            <div className="text-slate-800 text-[10px] font-mono mb-3 tracking-[0.3em]">MNTR_ID: VIZ_DATA_2026</div>
            <h2 className="text-sm font-light text-slate-500 uppercase tracking-[0.6em] italic">Chart Module Initializing</h2>
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
                  <span className="text-[10px] text-slate-700 font-mono tracking-tighter">SEC_0{idx + 1}</span>
                </div>
                <div className="p-10">
                  <div className="text-slate-300 leading-[1.8] text-lg font-light whitespace-pre-wrap">
                    {section.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <footer className="pt-16 pb-12 text-center">
          <p className="text-[9px] text-slate-700 uppercase tracking-[1em] opacity-50">
            End of Transmission • Feb 2026
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
