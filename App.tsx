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

  // Основная логика загрузки
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Сначала загружаем только цены для графика
      const res = await fetchRealtimePriceData(timeframe);
      setData(Array.isArray(res?.data) ? res.data : []);
      setSources(Array.isArray(res?.sources) ? res.sources : []);
      
      // 2. Делаем паузу 3 секунды, чтобы бесплатный лимит OpenRouter (429) "остыл"
      setTimeout(async () => {
        try {
          const repRes = await fetchWeeklyMarketReport();
          setReport(repRes?.report || null);
        } catch (reportErr) {
          console.error("Error loading report:", reportErr);
        }
      }, 6000);

    } catch (err) {
      console.error("Error loading price data:", err);
    } finally {
      // Ставим false, когда первая часть (цены) загружена
      setLoading(false);
    }
  }, [timeframe]);

  // Запуск при загрузке или смене таймфрейма
  useEffect(() => {
    loadData();
  }, [loadData]);

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
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="animate-pulse text-blue-600 font-medium">Загрузка данных...</div>
              </div>
            )}
            {data.length > 0 ? (
              <PriceChart data={data} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                {!loading && "Нет данных для отображения"}
              </div>
            )}
          </div>
        </div>

        {report && <MarketReport report={report} isLoading={loading} />}
      </div>
    </div>
  );
};

export default App;
