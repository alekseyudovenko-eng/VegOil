import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch('/api/get-prices');
        const data = await res.json();
        setReport(data.report || 'Отчет пуст');
      } catch (err) {
        setReport('Ошибка загрузки отчета');
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* МЕСТО ПОД ГРАФИК (ЛЕВАЯ КОЛОНКА) */}
        <div className="lg:col-span-2 bg-gray-800 rounded-3xl border-2 border-dashed border-gray-700 h-[500px] flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-500 uppercase tracking-widest">
              Здесь скоро появится интерактивный график
            </h3>
            <p className="text-gray-600 mt-2">Разработка возобновится завтра</p>
          </div>
        </div>

        {/* MARKET REPORT (ПРАВАЯ КОЛОНКА) */}
        <div className="lg:col-span-1 bg-gray-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[800px]">
          <h2 className="text-xl font-black mb-6 text-blue-400 uppercase border-b border-gray-700 pb-2">
            Market Intelligence Report
          </h2>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="prose prose-invert prose-blue max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
