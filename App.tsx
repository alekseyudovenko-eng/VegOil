import React, { useState, useEffect } from 'react';

function App() {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch('/api/get-prices');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setReport(data.report || 'Отчет пуст');
      } catch (err) {
        setReport('Ошибка загрузки отчета. Проверьте логи API.');
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            VegOil <span className="text-blue-500">Intelligence</span>
          </h1>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ГРАФИК-ЗАГЛУШКА */}
          <div className="lg:col-span-2 bg-gray-800 rounded-3xl border-2 border-dashed border-gray-700 h-[500px] flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">
                Здесь скоро появится интерактивный график
              </h3>
              <p className="text-gray-600 mt-2">Работа над данными возобновится завтра</p>
            </div>
          </div>

          {/* ОТЧЕТ */}
          <div className="lg:col-span-1 bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-700 flex flex-col">
            <h2 className="text-lg font-bold mb-4 text-blue-400 uppercase tracking-tight">
              Market Intelligence Report
            </h2>
            
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 leading-relaxed">
                  {report}
                </pre>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
