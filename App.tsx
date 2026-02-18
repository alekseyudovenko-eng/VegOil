import React, { useState, useEffect } from 'react';
import MarketReport from './components/MarketReport';

// Константы для навигации
const REGIONS = ['Russia & CIS', 'Central Asia', 'Europe', 'Global'];
const TOPICS = [
  { id: 'news', label: 'Основные новости' },
  { id: 'trade', label: 'Торговые потоки' },
  { id: 'policy', label: 'Регуляторная политика' },
  { id: 'prices', label: 'Ценовые котировки' }
];

export default function App() {
  // Состояния выбора
  const [region, setRegion] = useState(REGIONS[0]);
  const [topic, setTopic] = useState(TOPICS[0].id);
  
  // Состояния данных
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Функция загрузки (сейчас работает с нашим симулятором в api/get-prices.js)
  const loadData = async () => {
    setLoading(true);
    // Очищаем старый отчет, чтобы пользователь видел начало загрузки
    setReport(null); 
    
    try {
      const response = await fetch(
        `/api/get-prices?region=${encodeURIComponent(region)}&topic=${topic}`
      );
      const data = await response.json();
      
      if (data.report) {
        setReport(data.report);
      } else {
        setReport("### Внимание\nДанные временно недоступны.");
      }
    } catch (error) {
      setReport("### Ошибка соединения\nНе удалось получить данные от сервера.");
    } finally {
      setLoading(false);
    }
  };

  // Вызываем загрузку при каждом клике на фильтры
  useEffect(() => {
    loadData();
  }, [region, topic]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans antialiased text-slate-900">
      
      {/* Шапка терминала */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-black text-xl italic">V</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">
              VEGOIL <span className="text-blue-600">TERMINAL</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Market Intelligence Platform
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400">STATUS: SIMULATION_MODE</span>
        </div>
      </header>

      {/* Верхняя панель: Регионы */}
      <nav className="bg-white border-b border-slate-200 sticky top-[65px] z-20">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto no-scrollbar">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-8 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                region === r
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </nav>

      {/* Основной контент */}
      <main className="max-w-[1600px] mx-auto w-full flex flex-1 p-6 gap-8">
        
        {/* Боковая панель: Темы */}
        <aside className="w-64 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            <p className="text-[10px] font-black text-slate-400 uppercase px-4 py-3 tracking-widest">Аналитика</p>
            <div className="space-y-1">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    topic === t.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl text-white shadow-sm">
            <h4 className="text-xs font-bold mb-2 text-blue-400">Market Insights</h4>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Выбранный регион: <span className="text-white font-bold">{region}</span>. 
              Система анализирует данные за последние 30 дней.
            </p>
          </div>
        </aside>

        {/* Секция отчета */}
        <section className="flex-1 min-w-0">
          <MarketReport 
            report={report} 
            isLoading={loading} 
            title={`${region}: ${TOPICS.find(t => t.id === topic)?.label}`}
          />
        </section>

      </main>

      {/* Футер */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          © 2026 VEGOIL ANALYTICS. Все данные смоделированы для тестирования UI компонентов.
        </p>
      </footer>
    </div>
  );
}
