import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [reportLoading, setReportLoading] = useState(false); // Отдельный статус для отчета
  
  // Используем Ref, чтобы иметь возможность отменить загрузку отчета при смене таймфрейма
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    // Очищаем старый таймер, если пользователь сменил таймфрейм раньше 6 секунд
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setLoading(true);
    setReportLoading(true); // Отчет тоже начинаем ждать
    
    try {
      // 1. Загружаем цены (через VPN/Google или Groq)
      const res = await fetchRealtimePriceData(timeframe);
      setData(Array.isArray(res?.data) ? res.data : []);
      setSources(Array.isArray(res?.sources) ? res.sources : []);
      setLoading(false); // Цены пришли — убираем общую загрузку

      // 2. Делаем паузу 6 секунд для обхода лимитов
      timeoutRef.current = setTimeout(async () => {
        try {
          const repRes = await fetchWeeklyMarketReport();
          setReport(repRes?.report || null);
        } catch (reportErr) {
          console.error("Error loading report:", reportErr);
        } finally {
          setReportLoading(false); // Отчет либо пришел, либо упал
        }
      }, 6000);

    } catch (err) {
      console.error("Error loading price data:", err);
      setLoading(false);
      setReportLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
    // Чистим таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          priceInfo={{ 
            price: data[data.length - 1]?.close || 0, 
            change: data.length > 1 ? data[data.length-1].close - data[data.length-2].close : 0, 
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
                <div className="animate-pulse text-blue-600 font-medium text-center">
                   Загрузка реальных цен...<br/>
                   <span className="text-xs text-gray-400">(используем поиск Google)</span>
                </div>
              </div>
            )}
            
            {data.length > 0 ? (
              <PriceChart data={data} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                {!loading && "Нет данных. Проверьте VPN или API ключ."}
              </div>
            )}
          </div>
          
          {/* Источники данных */}
          {sources.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" 
                   className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                   Источник: {s.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Секция отчета */}
        <div className="relative">
          {reportLoading && !report && (
            <div className="p-6 bg-white rounded-xl border border-gray-100 text-center text-gray-500 italic">
              Генерируем маркет-анализ (ожидание лимита 6 сек)...
            </div>
          )}
          {report && <MarketReport report={report} isLoading={reportLoading} />}
        </div>
      </div>
    </div>
  );
};

export default App;
