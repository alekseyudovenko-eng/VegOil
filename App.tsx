
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
  const [currentPriceInfo, setCurrentPriceInfo] = useState({
    price: 0,
    change: 0,
    changePercent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, sources, isFallback } = await fetchRealtimePriceData(timeframe);
      setPriceData(data);
      setSources(sources);
      if (isFallback) setIsFallbackMode(true);
      
      if (data.length > 0) {
        setVisibleRange({ startIndex: 0, endIndex: data.length });
        const latestData = data[data.length - 1];
        const previousData = data.length > 1 ? data[data.length - 2] : latestData;
        const change = latestData.close - previousData.close;
        const changePercent = previousData.close !== 0 ? (change / previousData.close) * 100 : 0;
        
        setCurrentPriceInfo({
          price: latestData.close,
          change: change,
          changePercent: changePercent,
        });
      }
    } catch (err) {
      setError('Market data unavailable.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      const { report, sources, isFallback } = await fetchWeeklyMarketReport();
      setMarketReport(report);
      setReportSources(sources);
      if (isFallback) setIsFallbackMode(true);
    } catch (err) {
      console.error("Report fetch failed", err);
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTimeframe);
  }, [activeTimeframe, fetchData]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleTimeframeChange = (timeframe: Timeframe) => setActiveTimeframe(timeframe);
  const handleRefresh = () => {
    setIsFallbackMode(false);
    fetchData(activeTimeframe);
    fetchReport();
  };
  
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
    <div className="min-h-screen bg-light-secondary text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader
          priceInfo={currentPriceInfo}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
        
        {isFallbackMode && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-800">
                <strong>Regional Limitation:</strong> Google Search grounding is currently unavailable in your region. 
                Using internal model knowledge and simulated data for continuity.
              </p>
            </div>
            <button onClick={() => setIsFallbackMode(false)} className="text-yellow-600 hover:text-yellow-800 font-bold text-xs uppercase">Dismiss</button>
          </div>
        )}

        <main className="space-y-8">
          {/* Chart Section */}
          <div className="bg-light-primary rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
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

            <div className="h-[400px] relative mb-6">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue mb-4"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Updating prices...</p>
                </div>
              )}
              {!isLoading && !error && visibleData && visibleData.length > 0 && (
                <PriceChart data={visibleData} />
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
              {sources.length > 0 ? sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" className="text-[10px] text-brand-blue hover:underline">Price Source: {s.title}</a>
              )) : (
                <span className="text-[10px] text-gray-400 italic">No external sources linked in this session.</span>
              )}
            </div>
          </div>

          {/* Report Section */}
          <MarketReport report={marketReport} isLoading={isReportLoading} />

          {/* Report Sources */}
          {reportSources.length > 0 && (
            <div className="bg-white/50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Report Citations</h4>
              <div className="flex flex-wrap gap-3">
                {reportSources.slice(0, 6).map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" className="text-xs text-gray-500 hover:text-brand-blue transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="text-center text-gray-400 text-xs py-8">
          <p>© 2024 Market Intelligence Dashboard. Powered by Gemini & Google Search.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
