import { useState } from 'react';

function App() {
  const [sections, setSections] = useState<{ [key: string]: string }>({
    summary: '',
    prices: '',
    policy: ''
  });
  const [loading, setLoading] = useState<string | null>(null);

  const fetchSection = async (type: string) => {
    setLoading(type);
    try {
      const res = await fetch(`/api/get-prices?section=${type}`);
      const data = await res.json();
      setSections(prev => ({ ...prev, [type]: data.report }));
    } catch (e) {
      console.error("Error loading section:", e);
    } finally {
      setLoading(null);
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    return (
      <div 
        className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content
          .replace(/## (.*)/g, '<h2 class="text-xl font-bold text-sky-800 mt-6 mb-3 border-b pb-2">$1</h2>')
          .replace(/\*\* (.*)/g, '<p class="font-bold text-slate-900 mt-4">$1</p>')
          .replace(/^\* (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
        }} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Agro<span className="text-emerald-600">Oil</span> Monitor
          </h1>
          <p className="text-slate-500 font-medium">Модульный анализ рынка масличных</p>
        </header>

        {/* ПАНЕЛЬ КНОПОК */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button 
            onClick={() => fetchSection('summary')}
            disabled={!!loading}
            className="bg-white hover:bg-slate-50 p-6 rounded-xl border-2 border-transparent hover:border-emerald-500 shadow-sm transition-all text-left group"
          >
            <div className="text-emerald-600 font-bold mb-1 group-hover:scale-110 transition-transform">Global News</div>
            <div className="text-xs text-slate-400">{loading === 'summary' ? 'Загрузка...' : 'Обзор мировых трендов'}</div>
          </button>

          <button 
            onClick={() => fetchSection('prices')}
            disabled={!!loading}
            className="bg-white hover:bg-slate-50 p-6 rounded-xl border-2 border-transparent hover:border-sky-500 shadow-sm transition-all text-left group"
          >
            <div className="text-sky-600 font-bold mb-1 group-hover:scale-110 transition-transform">Market Prices</div>
            <div className="text-xs text-slate-400">{loading === 'prices' ? 'Загрузка...' : 'Масла и Brent Crude'}</div>
          </button>

          <button 
            onClick={() => fetchSection('policy')}
            disabled={!!loading}
            className="bg-white hover:bg-slate-50 p-6 rounded-xl border-2 border-transparent hover:border-amber-500 shadow-sm transition-all text-left group"
          >
            <div className="text-amber-600 font-bold mb-1 group-hover:scale-110 transition-transform">Regulations</div>
            <div className="text-xs text-slate-400">{loading === 'policy' ? 'Загрузка...' : 'Пошлины и ограничения'}</div>
          </button>
        </div>

        {/* БЛОКИ КОНТЕНТА */}
        <div className="space-y-6">
          {Object.entries(sections).map(([key, content]) => (
            content && (
              <div key={key} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                {renderContent(content)}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default App; // ВОТ ЭТА СТРОЧКА ИСПРАВИТ ОШИБКУ БИЛДА
