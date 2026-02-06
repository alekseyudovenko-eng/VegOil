import { useState } from 'react';

function App() {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/get-prices');
      const data = await res.json();

      if (data.error) {
        setError(data.error.message || 'API Error');
      } else {
        // Форматирование простейшего Markdown в HTML
        let formatted = data.report
          .replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-sky-700 mt-8 mb-4 flex items-center gap-3"><span class="w-1 h-6 bg-emerald-500 rounded"></span>$1</h2>')
          .replace(/\*\* (.*)/g, '<p class="font-bold mt-4">$1</p>')
          .replace(/^\* (.*)/gm, '<p class="pl-5 border-l-2 border-slate-100 my-2 text-slate-600 italic">• $1</p>');
        
        setReport(formatted);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-10 font-sans">
      {/* Top Bar */}
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Sector: Oilseeds</span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Market Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Agro<span className="text-emerald-600">Oil</span> Analysis
          </h1>
        </div>
        <div className="mt-6 md:mt-0">
          <button 
            onClick={generateReport}
            disabled={loading}
            className={`bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{loading ? 'Analyzing Data...' : 'Generate Market Update'}</span>
            {!loading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-slate-900 font-bold text-sm mb-4">Live Indicators</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Brent Crude</span>
                <span className="text-slate-900 font-bold">$83.42</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">SFO Export</span>
                <span className="text-slate-900 font-bold">$965.00</span>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-600 font-medium pt-2">
                <span>● Black Sea Active</span>
                <span>2026.02.06</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <section className="lg:col-span-3">
          {loading && (
            <div className="mb-6">
              <div className="h-1 w-full bg-slate-200 overflow-hidden rounded-full">
                <div className="h-full bg-emerald-500 animate-progress origin-left"></div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium animate-pulse text-center">Consulting global databases and Google Search...</p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 min-h-[500px] shadow-sm">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg font-mono text-sm border border-red-100 mb-6">
                <strong>System Error:</strong> {error}
              </div>
            )}

            {!report && !loading && !error && (
              <div className="text-center py-20">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-slate-400 font-medium">Ready for Analysis</h3>
                <p className="text-slate-300 text-sm">Click the button to fetch the latest oilseed market news.</p>
              </div>
            )}

            {report && (
              <div 
                className="report-view leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ __html: report }} 
              />
            )}
          </div>
        </section>
      </main>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(0) scaleX(0.5); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
        .animate-progress {
          animation: progress 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}

export default App;
