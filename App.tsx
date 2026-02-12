import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Page = 'news' | 'prices' | 'policy' | 'trade' | 'summary';

function App() {
  const [activePage, setActivePage] = useState<Page>('news');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  // Запрос данных под конкретную страницу
  const fetchData = async (page: Page) => {
    setLoading(true);
    setReport(''); // Очищаем старый отчет
    try {
      // Отправляем тип страницы на бэкенд
      const res = await fetch(`/api/get-prices?category=${page}`);
      const data = await res.json();
      setReport(data.report);
    } catch (e) {
      setReport("Ошибка загрузки данных.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activePage);
  }, [activePage]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* САЙДБАР (Навигация) */}
      <nav className="w-64 bg-slate-900 text-white p-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-emerald-400 mb-8">AgroOil Terminal</h1>
        {[
          { id: 'news', label: '1. Главная: Новости' },
          { id: 'prices', label: '2. Цены' },
          { id: 'policy', label: '3. Регуляторика' },
          { id: 'trade', label: '4. Торговые потоки' },
          { id: 'summary', label: '5. Резюме' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as Page)}
            className={`text-left p-3 rounded-lg transition ${activePage === item.id ? 'bg-emerald-600' : 'hover:bg-slate-800'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* КОНТЕНТ */}
      <main className="flex-1 p-8 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
