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
  // 1. Сначала объявляем ВСЕ стейты
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

  // 2. Функции загрузки
  const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    try {
      const response = await fetchRealtimePriceData(timeframe);
      const data = Array.isArray(response?.data) ? response.data : [];
      setPriceData(data);
      setSources(Array.isArray(response?.sources) ? response.sources : []);
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
      setReportSources(Array.isArray(response?.sources) ? response.sources : []);
    } catch (e) {
      setMarketReport(null);
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  // 3. Эффекты
  useEffect(() => { fetchData(activeTimeframe); }, [activeTimeframe, fetchData]);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  // 4. Расчет зависимых переменных (ТОЛЬКО ПОСЛЕ ОБЪЯВЛЕНИЯ priceData)
  const safePriceData = Array.isArray(priceData) ? priceData : [];
  const visibleData = safePriceData.slice(visibleRange.startIndex, visibleRange.endIndex);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader 
          priceInfo={currentPriceInfo} 
          isLoading={isLoading} 
          onRefresh={() => fetchData(activeTimeframe)} 
        />
        
        {isFallbackMode && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded text-amber-800 text-sm">
            ⚠️ Режим симуляции: Данные API недоступны (404), показан пример.
          </div>
        )}

        <main className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <TimeframeSelector 
                timeframes={TIMEFRAMES} 
                activeTimeframe={activeTimeframe} 
                onSelect={setActiveTimeframe} 
              />
              {/* Исправлено: передаем safePriceData.length */}
              <ChartControls 
                onZoomIn={() => {}} 
                onZoomOut={() => {}}
                onPanLeft={() => {}}
                onPanRight={() => {}}
                onReset={() => setVisibleRange({ startIndex: 0, endIndex: safePriceData.length })}
                canZoomIn={visibleData.length > MIN_CANDLES_VISIBLE}
                canZoomOut={true}
                canPanLeft={visibleRange.startIndex > 0}
                canPanRight={visibleRange.endIndex < safePriceData.length}
              />
            </div>

            <div className="h-[400px] w-full relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 font-bold text-blue-600">
                  ЗАГРУЗКА...
                </div>
              )}
              {visibleData.length > 0 ? (
                <PriceChart data={visibleData} />
              ) : (
                !isLoading && <div className="h-full flex items-center justify-center text-gray-400">График временно недоступен</div>
              )}
            </div>

            {sources && sources.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                {sources.map((s, i) => (
                  <a key={`src-${i}`} href={s?.uri || '#'} target="_blank" rel="noreferrer" className="text-[10px] text-blue-5
