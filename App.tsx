import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [report, setReport] = useState<string>('Loading Market Intelligence...');

  useEffect(() => {
    fetch('/api/get-prices')
      .then(res => res.json())
      .then(data => setReport(data.report))
      .catch(() => setReport('Error loading report.'));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. ГРАФИК ТЕПЕРЬ В САМОМ ВЕРХУ */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-4xl mb-4">📈</div>
            <h2 className="text-xl font-light tracking-widest uppercase text-white/40">
              Скоро здесь появится график
            </h2>
          </div>
        </div>

        {/* 2. ОТЧЕТ СТРОГО ПОД ГРАФИКОМ */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 text-emerald-500">
            Market Intelligence Report
          </h1>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-gray-300">
              {report}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
