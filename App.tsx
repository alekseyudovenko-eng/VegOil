import React, { useState, useEffect, useCallback } from 'react';
import type { PriceData, Timeframe, GroundingSource, MarketReport as MarketReportType } from './types';
import { fetchRealtimePriceData, fetchWeeklyMarketReport } from './services/priceService';
import DashboardHeader from './components/DashboardHeader';
import TimeframeSelector from './components/TimeframeSelector';
import PriceChart from './components/PriceChart';
import ChartControls from './components/ChartControls';
import MarketReport from './components/MarketReport';
import { TIMEFRAMES } from './constants';

const App: React.FC = () => {
  const [data, setData] = useState<PriceData[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [report, setReport] = useState<MarketReportType | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRealtimePriceData(timeframe);
      setData(Array.isArray(res?.data) ? res.data : []);
      setSources(Array.isArray(res?.sources) ? res.sources : []);
      
      const repRes = await fetchWeeklyMarketReport();
      setReport(repRes?.report || null);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

 useEffect(() => {
  const loadData = async () => {
    await fetchPrices(); // Сначала цены
    setTimeout(async () => {
      await fetchReport(); // Через 2 секунды новости
    }, 2000);
  };
  loadData();
}, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          priceInfo={{ 
            price: data[data.length - 1]?.close || 0, 
            change: 0, 
            changePercent: 0 
          }} 
          isLoading={loading} 
          onRefresh={loadData} 
        />

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <TimeframeSelector 
              timeframes={TIMEFRAMES} 
              activeTimeframe={timeframe} 
              onSelect={setTimeframe} 
            />
            <ChartControls 
              onZoomIn={() => {}} onZoomOut={() => {}} onPanLeft={() => {}} onPanRight={() => {}} onReset={() => {}}
              canZoomIn={false} canZoomOut={false} canPanLeft={false} canPanRight={false}
            />
          </div>

          <div className="h-[400px] relative">
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">Загрузка...</div>}
            {data.length > 0 ? <PriceChart data={data} /> : <div className="h-full flex items-center justify-center text-gray-400">Нет данных</div>}
          </div>
        </div>

        {report && <MarketReport report={report} isLoading={loading} />}
      </div>
    </div>
  );
};

export default App;
