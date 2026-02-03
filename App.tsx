import React, { useState, useEffect, useCallback } from 'react';
import type { PriceData, Timeframe, GroundingSource, MarketReport as MarketReportType } from './types';
// Импортируем только одну функцию, так как API теперь монолитное
import { fetchRealtimePriceData } from './services/priceService';
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
  const [marketReport, setMarketReport] = useState<MarketReportType | null>(null);
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [currentPriceInfo, setCurrentPriceInfo] = useState({
    price: 0,
    change: 0,
    changePercent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      // Вызываем наш новый API, который возвращает { data, report, sources }
      const response = await fetchRealtimePriceData(timeframe);
      
      // Раскладываем данные по стейтам
      const data = response.data || [];
      const report = (response as any).report || null; // Приводим к any, так как структура расширилась
      const allSources = response.sources || [];

      setPriceData(data);
      setMarketReport(report);
      setSources(allSources);
      
      if (response.isFallback) setIsFallbackMode(true);
      
      if (data.length > 0) {
        setVisibleRange({ startIndex: 0, endIndex: data.length });
        const latestData = data[data.length - 1];
        const previousData = data.length > 1 ? data[data.length - 2] : latestData;
        const change = latestData.close - previousData.close;
        const changePercent = previousData.close !== 0 ? (change / previousData.close) * 100 : 0;
        
        setCurrentPriceInfo({
          price: latestData.close,
          change,
          changePercent,
        });
      }
    } catch (err) {
      setError('Market data synchronization failed.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Один эффект для всего
  useEffect(() => {
    fetchAllData(activeTimeframe);
  }, [activeTimeframe, fetchAllData]);

  const handleTimeframeChange = (timeframe: Timeframe) => setActiveTimeframe(timeframe);
  const handleRefresh = () => {
    setIsFallbackMode(false);
    fetchAllData(activeTimeframe);
  };
  
  // Функции Zoom и Pan остаются без изменений...
  const handleZoomIn = () => {
    const currentWidth = visibleRange.endIndex - visibleRange.startIndex;
    if (currentWidth <= MIN_CANDLES_VISIBLE) return;
    const zoomAmount = Math.max(1, Math.floor(currentWidth * 0.1));
    setVisibleRange(prev => ({
      startIndex: prev.startIndex + zoomAmount,
      endIndex: prev.endIndex - zoomAmount,
    }));
  };

  const handleZoomOut = () => {
    const zoomAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.1));
    setVisibleRange(prev => ({
      startIndex: Math.max(0, prev.startIndex - zoomAmount),
      endIndex: Math.min(priceData.length, prev.endIndex + zoomAmount),
    }));
  };

  const handlePanLeft = () => {
    const panAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.2));
    const width = visibleRange.endIndex - visibleRange.startIndex;
    const newStartIndex = Math.max(0, visibleRange.startIndex - panAmount);
    setVisibleRange({ startIndex: newStartIndex, endIndex: newStartIndex + width });
  };

  const handlePanRight = () => {
    const panAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.2));
    const width = visibleRange.endIndex - visibleRange.startIndex;
    const newEndIndex = Math.min(priceData.length, visibleRange.endIndex + panAmount);
    setVisibleRange({ startIndex: newEndIndex - width, endIndex: newEndIndex });
  };

  const visibleData = priceData.slice(visibleRange.startIndex, visibleRange.endIndex);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-800 font-sans p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-8 print:space-y-4">
        <div className="print:hidden">
          <DashboardHeader
            priceInfo={currentPriceInfo}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>
        
        {isFallbackMode && (
          <div className="print:hidden bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800">
                <strong>Data Sync:</strong> Running on consolidated analytical stream.
              </p>
            </div>
            <button onClick={() => setIsFallbackMode(false)} className="text-amber-600 hover:text-amber-800 font-bold text-xs uppercase">Dismiss</button>
          </div>
        )}

        <main className="space-y-8 print:space-y-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 print:hidden">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
              <TimeframeSelector
                timeframes={TIMEFRAMES}
                activeTimeframe={activeTimeframe}
                onSelect={handleTimeframeChange}
              />
              <ChartControls 
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onPanLeft={handlePanLeft}
                onPanRight={handlePanRight}
                onReset={() => setVisibleRange({ startIndex: 0, endIndex: priceData.length })}
                canZoomIn={visibleRange.endIndex - visibleRange.startIndex > MIN_CANDLES_VISIBLE}
                canZoomOut={visibleRange.startIndex > 0 || visibleRange.endIndex < priceData.length}
                canPanLeft={visibleRange.startIndex > 0}
                canPanRight={visibleRange.endIndex < priceData.length}
              />
            </div>

            <div className="h-[400px] relative mb-6 min-h-[400px]">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-blue mb-4"></div>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Analysing Market...</p>
                </div>
              )}
              {!error && visibleData.length > 0 ? (
                <PriceChart data={visibleData} />
              ) : (
                !isLoading && <div className="h-full flex items-center justify-center text-gray-300 italic">No historical data found for this period.</div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50">
              {sources.slice(0, 3).map((s, i) => (
                <a key={i} href={s.uri} target="_blank" className="text-[10px] font-bold text-slate-400 hover:text-brand-blue uppercase tracking-tighter transition-colors">
                  Source: {s.title.substring(0, 30)}...
                </a>
              ))}
            </div>
          </div>

          <div className="print:m-0 print:p-0">
            {/* Передаем isLoading из общего процесса */}
            <MarketReport report={marketReport} isLoading={isLoading} />
          </div>
        </main>

        <footer className="text-center text-gray-300 text-[10px] font-bold uppercase tracking-[0.2em] py-12 print:hidden">
          Eurasia Intelligence Hub • 2026 • Verified Stream
        </footer>
      </div>
    </div>
  );
};

export default App;
