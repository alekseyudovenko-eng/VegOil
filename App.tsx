// App.tsx
import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import MarketReport from './components/MarketReport';
import { Region, TopicId, Topic, MarketReport as MarketReportType } from './types';

// Константы вынесены для удобства управления
const REGIONS: Region[] = ['Russia & CIS', 'Central Asia', 'Europe', 'Global'];

const TOPICS: Topic[] = [
  { id: 'news', label: 'Основные новости' },
  { id: 'trade', label: 'Торговые потоки' },
  { id: 'policy', label: 'Регуляторная политика' },
  { id: 'prices', label: 'Ценовые котировки' }
];

export default function App() {
  // Состояния для терминала
  const [selectedRegion, setSelectedRegion] = useState<Region>(REGIONS[0]);
  const [selectedTopic, setSelectedTopic] = useState<TopicId>(TOPICS[0].id);
  
  // Состояние данных
  const [reportData, setReportData] = useState<MarketReportType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Функция загрузки данных
  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // Формируем запрос к твоему API
      const response = await fetch(
        `/api/get-prices?region=${encodeURIComponent(selectedRegion)}&topic=${selectedTopic}`
      );
      const data = await response.json();

      if (data.report) {
        // Приводим ответ к нашему новому типу из types.ts
        setReportData({
          content: data.report,
          region: selectedRegion,
          topic: selectedTopic
        });
      } else if (data.error) {
        setReportData({ content: `### Ошибка API: ${data.error}` });
      }
    } catch (error) {
      setReportData({ content: "### Ошибка соединения с сервером." });
    } finally {
      setLoading(false);
    }
  };

  // Вызываем загрузку при каждом изменении закладок
  useEffect(() => {
    fetchMarketData();
  }, [selectedRegion, selectedTopic]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Шапка сайта */}
      <DashboardHeader />

      {/* Верхняя панель: Регионы */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-8 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                selectedRegion === r
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto w-full flex flex-1 p-6 gap-6">
        {/* Боковая панель: Темы */}
        <aside className="w-72 flex flex-col gap-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-4 py-2 tracking-widest">Категории</p>
            {TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedTopic === t.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Место для доп. инфо или виджетов */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-800 leading-relaxed">
              Данные обновляются в реальном времени на основе анализа рыночных индикаторов 
              <strong> {selectedRegion}</strong>.
            </p>
          </div>
        </aside>

        {/* Основной контент: Отчет */}
        <section className="flex-1">
          <MarketReport 
            report={reportData} 
            isLoading={loading} 
            // Мы можем добавить заголовок прямо в пропсы, если обновили MarketReport.tsx
            title={`${selectedRegion}: ${TOPICS.find(t => t.id === selectedTopic)?.label}`}
          />
          
          {/* Здесь можно добавить твои графики ChartControls, PriceChart и т.д. ниже отчета */}
        </section>
      </main>
    </div>
  );
}
