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
  const [mainPriceData, setMainPriceData] = useState<PriceData[]>([]);
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
      const data = Array.isArray(response?.data) ? response.data : [];
      
      setMainPriceData(data);
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
      console.error(err);
      setMainPriceData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTimeframe);
    fetchWeeklyMarketReport().then(res => {
      setMarketReport(res?.report || null);
      setReportSources(Array.isArray(res?.sources) ? res.sources : []);
      setIsReportLoading(false);
    });
  }, [activeTimeframe, fetchData]);

  // Безопасный срез данных
  const getVisibleData = () => {
    if (!Array.isArray(mainPriceData)) return [];
    return mainPriceData.slice(visibleRange.startIndex, visibleRange.endIndex);
  };

  const currentVisible = getVisibleData();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          priceInfo={currentPriceInfo} 
          isLoading={isLoading} 
          onRefresh={() => fetchData(activeTimeframe)} 
        />
        
        {isFallbackMode && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded text-amber-900 text-sm">
            ⚠️ Режим симуляции: API временно недоступно.
          </div>
        )}

        <main className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <TimeframeSelector 
                timeframes={TIMEFRAMES} 
                activeTimeframe={activeTimeframe} 
                onSelect={setActiveTimeframe} 
              />
              <ChartControls 
                onZoomIn={() => {}} 
                onZoomOut={() => {}}
                onPanLeft={() => {}}
                onPanRight={() => {}}
                onReset={() => setVisibleRange({ startIndex: 0, endIndex: mainPriceData.length })}
                canZoomIn={currentVisible.length > 5}
                canZoomOut={true}
                canPanLeft={visibleRange.startIndex > 0}
                canPanRight={visibleRange.endIndex < mainPriceData.length}
              />
            </div>

            <div className="h-[400px] w-full relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 font-bold text-blue-600">
                  ОБНОВЛЕНИЕ...
                </div>
              )}
              {currentVisible.length > 0 ? (
                <PriceChart data={currentVisible} />
              ) : (
                !isLoading && <div className="h-full flex items-center justify-center text-gray-400">График не загружен</div>
              )}
            </div>

            {sources.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                {sources.map((s, i) => (
                  <a key={i} href={s?.uri || '#'} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                    Источник: {s?.title || 'Data'}
                  </a>
                ))}
              </div>
            )}
          </div>

          <MarketReport report={marketReport} isLoading={isReportLoading} />
        </main>
      </div>
    </div>
  );
};

export default App;
