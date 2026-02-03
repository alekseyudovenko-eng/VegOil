import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [reportData, setReportData] = useState<{title: string, content: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-prices')
      .then(res => res.json())
      .then(data => {
        // Парсим сырой текст отчета на разделы по заголовкам ##
        const rawText = data.report || '';
        const sections = rawText.split('##').filter(Boolean).map(s => {
          const lines = s.trim().split('\n');
          return {
            title: lines[0].trim(),
            content: lines.slice(1).join('\n').trim()
          };
        });
        setReportData(sections);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter">TERMINAL<span className="text-emerald-500">.</span></h1>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-[0.4em]">Global Commodity Intelligence</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">System Status</p>
            <p className="text-xs text-emerald-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Live Data Feed
            </p>
          </div>
        </div>

        {/* CHART PLACEHOLDER */}
        <div className="relative group overflow-hidden bg-[#0d0d0d] border border-white/5 rounded-2xl p-12 flex items-center justify-center min-h-[300px] transition-all hover:border-emerald-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-center relative z-10">
            <div className="text-slate-700 text-sm font-mono mb-2">MOD-ID: VISUAL_DATA_01</div>
            <h2 className="text-lg font-medium text-slate-400 uppercase tracking-widest">Chart Module Initializing...</h2>
          </div>
        </div>

        {/* ANALYTICS REPORT */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center py-20 space-y-4">
              <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 animate-pulse font-mono text-sm">Processing Neural Analysis...</p>
            </div>
          ) : (
            reportData.map((section, idx) => (
              <div key={idx} className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden transition-all hover:bg-[#111]">
                <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{section.title}</h3>
                  <span className="text-[10px] text-slate-600 font-mono">0{idx + 1}</span>
                </div>
                <div className="p-8">
                  <div className="text-slate-300 leading-relaxed text-base space-y-4 font-light whitespace-pre-wrap">
                    {/* Убираем лишние символы при рендеринге контента */}
                    {section.content.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <footer className="pt-12 pb-8 text-center border-t border-white/5">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            Data provided by Tavily & Groq Llama 3.1 • © 2026 Analytics Terminal
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
