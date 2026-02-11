import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // Импортируем нормальный парсер
import remarkGfm from 'remark-gfm'; // Импортируем поддержку таблиц

function App() {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-prices');
      const data = await res.json();
      setReport(data.report);
    } catch (e) {
      setReport("Ошибка загрузки данных.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black tracking-tight">Agro<span className="text-emerald-600">Oil</span> Monitor</h1>
          <button 
            onClick={fetchReport} 
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? 'Обновление...' : 'Обновить отчет'}
          </button>
        </header>

        {report ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in duration-500">
            {/* ВМЕСТО dangerouslySetInnerHTML ИСПОЛЬЗУЕМ ReactMarkdown */}
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 font-medium italic">
            {loading ? 'ИИ анализирует рынки...' : 'Нажмите обновить для загрузки данных'}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
