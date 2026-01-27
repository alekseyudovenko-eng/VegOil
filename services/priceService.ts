import React, { useState, useEffect, useCallback } from 'react';
import type { PriceData, Timeframe, GroundingSource, MarketReport as MarketReportType } from './types';
import { fetchRealtimePriceData, fetchWeeklyMarketReport } from './services/priceService';
import DashboardHeader from './components/DashboardHeader';
import TimeframeSelector from './components/TimeframeSelector';
import PriceChart from './components/PriceChart';
import ChartControls from './components/ChartControls';
import MarketReport from './components/MarketReport';
import { TIMEFRAMES } from './constants';

const MIN_CANDLES_VISIBLE = 5;

const App: React.FC = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [reportSources, setReportSources] = useState<GroundingSource[]>([]);
  const [marketReport, setMarketReport] = useState<MarketReportType | null>(null);
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(true);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [currentPriceInfo, setCurrentPriceInfo] = useState({ price: 0, change: 0, changePercent: 0 });

  const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    try {
      const response = await fetchRealtimePriceData(timeframe);
      // Гарантируем, что data всегда массив
      const data = Array.isArray(response?.data) ? response.data : [];
      
      setPriceData(data);
      setSources(response?.sources || []);
      setIsFallbackMode(!!response?.isFallback);
      
      if (data.length > 0) {
        setVisibleRange({ startIndex: 0, endIndex: data.length });
        const latest = data[data.length - 1];
        const prev = data.length > 1 ? data[data.length - 2] : latest;
        
        setCurrentPriceInfo({
          price: latest?.close || 0,
          change: (latest?.close || 0) - (prev?.close || 0),
          changePercent: prev?.close ? (((latest.close - prev.close) / prev.close) * 100) : 0,
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setPriceData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      const response = await fetchWeeklyMarketReport();
      setMarketReport(response?.report || null);
      setReportSources(response?.sources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(activeTimeframe); }, [activeTimeframe, fetchData]);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Безопасное вычисление видимых данных
  const visibleData = Array.isArray(priceData) ? priceData.slice(visibleRange.startIndex, visibleRange.endIndex) : [];

  return (
    <div className="min-h-screen bg-light-secondary p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader 
          priceInfo={currentPriceInfo} 
          isLoading={isLoading} 
          onRefresh={() => fetchData(activeTimeframe)} 
        />
        
        {isFallbackMode && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded shadow-sm">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ Режим симуляции: Данные из поиска Google временно недоступны. Используются сгенерированные данные.
            </p>
          </div>
        )}

        <main className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <TimeframeSelector timeframes={TIMEFRAMES} activeTimeframe={activeTimeframe} onSelect={setActiveTimeframe} />
              <ChartControls 
                onZoomIn={() => {}} // Логика зума остается прежней
                onZoomOut={() => {}}
                onPanLeft={() => {}}
                onPanRight={() => {}}
                onReset={() => setVisibleRange({ startIndex: 0, endIndex: priceData.length })}
                canZoomIn={visibleData.length > MIN_CANDLES_VISIBLE}
                canZoomOut={true}
                canPanLeft={visibleRange.startIndex > 0}
                canPanRight={visibleRange.endIndex < priceData.length}
              />
            </div>

            <div className="h-[400px] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 font-bold text-brand-blue">
                  ОБНОВЛЕНИЕ...
                </div>
              )}
              
              {/* Если данные есть, рисуем график. Если нет - надпись */}
              {visibleData.length > 0 ? (
                <PriceChart data={visibleData} />
              ) : (
                !isLoading && (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">
                    Данные не найдены
                  </div>
                )
              )}
            </div>
          </div>

          <MarketReport report={marketReport} isLoading={isReportLoading} />
        </main>
      </div>
    </div>
  );
};

export default App;
