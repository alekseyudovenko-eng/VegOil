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
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchRealtimePriceData(timeframe);
      const data = response?.data || [];
      const incomingSources = response?.sources || [];
      
      setPriceData(data);
      setSources(incomingSources);
      if (response?.isFallback) setIsFallbackMode(true);
      
      if (Array.isArray(data) && data.length > 0) {
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
      setError('Market data unavailable.');
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

  const visibleData = Array.isArray(priceData) ? priceData.slice(visibleRange.startIndex, visibleRange.endIndex) : [];

  return (
    <div className="min-h-screen bg-light-secondary p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader priceInfo={currentPriceInfo} isLoading={isLoading} onRefresh={() => fetchData(activeTimeframe)} />
        
        <main className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between mb-6">
              <TimeframeSelector timeframes={TIMEFRAMES} activeTimeframe={activeTimeframe} onSelect={setActiveTimeframe} />
              <ChartControls 
                onZoomIn={() => {}} // Добавь свою логику зума
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
              {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">Loading...</div>}
              
              {/* ЗАЩИТА ОТ БЕЛОГО ЭКРАНА */}
              {!isLoading && visibleData && visibleData.length > 0 ? (
                <PriceChart data={visibleData} />
              ) : (
                !isLoading && <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
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
