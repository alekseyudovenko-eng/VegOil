// App.tsx
import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import MarketReport from './components/MarketReport';

const REGIONS = ['Russia & CIS', 'Central Asia', 'Europe', 'Global'];
const TOPICS = [
  { id: 'news', label: 'Main News' },
  { id: 'trade', label: 'Trade Flows' },
  { id: 'policy', label: 'Regulatory Policy' },
  { id: 'prices', label: 'Price Quotes' }
];

export default function App() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/get-prices?region=${encodeURIComponent(region)}&topic=${topic}`);
      const data = await res.json();
      setReport(data.report || data.error);
    } catch (e) {
      setReport("Connection error.");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [region, topic]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <DashboardHeader />
      
      {/* Горизонтальные вкладки Регионов */}
      <div className="flex bg-slate-800 border-b border-slate-700">
        {REGIONS.map(r => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${region === r ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex">
        {/* Боковые вкладки Тем */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 min-h-[calc(100vh-112px)]">
          {TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`w-full text-left px-6 py-4 text-sm transition-all ${topic === t.id ? 'bg-slate-700 border-l-4 border-blue-500' : 'hover:bg-slate-700/50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Контентная область - используем твой компонент MarketReport */}
        <main className="flex-1 p-8">
          <MarketReport 
            title={`${region}: ${TOPICS.find(t => t.id === topic)?.label}`} 
            content={report} 
            isLoading={loading} 
          />
        </main>
      </div>
    </div>
  );
}
