import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const menuItems = [
  { id: 'news', label: '1. Главная: Новости', icon: '📰' },
  { id: 'prices', label: '2. Цены', icon: '📊' },
  { id: 'policy', label: '3. Регуляторика', icon: '⚖️' },
  { id: 'trade', label: '4. Торговые потоки', icon: '🚢' },
  { id: 'summary', label: '5. Резюме', icon: '📝' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('news');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async (tab: string) => {
    setLoading(true);
    setReport('');
    try {
      const res = await fetch(`/api/get-prices?category=${tab}`);
      const data = await res.json();
      setReport(data.report);
    } catch (e) {
      setReport("Ошибка загрузки данных.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(activeTab); }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white p-6 shadow-xl shrink-0">
        <div className="mb-10 px-2 text-2xl font-black text-emerald-400 tracking-tighter">AGRO-MONITOR</div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                activeTab === item.id ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20' : 'hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{menuItems.find(i => i.id === activeTab)?.label}</h2>
            <p className="text-slate-500">Данные на {new Date().toLocaleDateString()}</p>
          </div>
          <button onClick={() => loadData(activeTab)} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">
            {loading ? 'Загрузка...' : 'Обновить страницу'}
          </button>
        </header>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200 min-h-[600px]">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-100 w-1/3 rounded"></div>
              <div className="h-4 bg-gray-50 w-full rounded"></div>
              <div className="h-4 bg-gray-50 w-full rounded"></div>
            </div>
          ) : (
            <article className="prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
