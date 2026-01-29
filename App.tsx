import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PriceData, Timeframe, GroundingSource, MarketReport as MarketReportType } from './types';
import { fetchRealtimePriceData, fetchWeeklyMarketReport } from './services/priceService';
import DashboardHeader from './components/DashboardHeader';
import TimeframeSelector from './components/TimeframeSelector';
import PriceChart from './components/PriceChart';
import MarketReport from './components/MarketReport';
import { TIMEFRAMES } from './constants';

const App: React.FC = () => {
  const [data, setData] = useState<PriceData[]>([]);
  const [report, setReport] = useState<MarketReportType | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Загружаем цены
      const priceRes = await fetchRealtimePriceData(timeframe);
      setData(priceRes.data);
      
      // Пауза 6 секунд перед отчетом для лимитов
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        const repRes = await fetchWeeklyMarketReport();
        setReport(repRes.report);
      }, 6000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadAll();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [loadAll]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          priceInfo={{ price: data[data.length-1]?.close || 0, change: 0, changePercent: 0 }} 
          isLoading={loading} 
          onRefresh={loadAll} 
        />
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <TimeframeSelector timeframes={TIMEFRAMES} activeTimeframe={timeframe} onSelect={setTimeframe} />
          <div className="h-[400px] mt-6 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full text-blue-500">Загрузка данных из Google Search...</div>
            ) : data.length > 0 ? (
              <PriceChart data={data} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 italic">Реальные данные не найдены. Попробуйте с VPN.</div>
            )}
          </div>
        </div>
        {report && <MarketReport report={report} isLoading={false} />}
      </div>
    </div>
  );
};

export default App;
