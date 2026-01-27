// ... (оставляем импорты без изменений)

const App: React.FC = () => {
  // ... (оставляем стейты без изменений)

  // ИСПРАВЛЕНИЕ: Добавляем безопасную проверку для visibleData
  const visibleData = Array.isArray(priceData) ? priceData.slice(visibleRange.startIndex, visibleRange.endIndex) : [];

  return (
    <div className="min-h-screen bg-light-secondary p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader priceInfo={currentPriceInfo} isLoading={isLoading} onRefresh={() => fetchData(activeTimeframe)} />
        
        {isFallbackMode && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-800 text-sm">
            ⚠️ Режим симуляции: Данные API недоступны, показан пример.
          </div>
        )}

        <main className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between mb-6">
              <TimeframeSelector timeframes={TIMEFRAMES} activeTimeframe={activeTimeframe} onSelect={setActiveTimeframe} />
            </div>

            <div className="h-[400px] w-full relative">
              {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 font-bold">ОБНОВЛЕНИЕ...</div>}
              {visibleData.length > 0 ? (
                <PriceChart data={visibleData} />
              ) : (
                !isLoading && <div className="h-full flex items-center justify-center text-gray-400">График временно недоступен</div>
              )}
            </div>

            {/* Защищенный вывод источников цен */}
            {sources && sources.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                {sources.map((s, i) => (
                  <a key={`src-${i}`} href={s?.uri || '#'} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 underline">
                    Источник: {s?.title || 'Без названия'}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: 
              Рендерим MarketReport ТОЛЬКО если есть данные, либо если идет загрузка. 
              Если report === null и загрузки нет — не рендерим вообще. */}
          {(marketReport || isReportLoading) && (
            <MarketReport report={marketReport} isLoading={isReportLoading} />
          )}
          
          {/* Защищенный вывод источников отчета */}
          {reportSources && reportSources.length > 0 && (
            <div className="p-4 bg-white/50 rounded border text-xs text-gray-500">
              <h4 className="font-bold mb-2 uppercase">Источники отчета:</h4>
              <div className="flex flex-wrap gap-4">
                {reportSources.map((s, i) => (
                  <a key={`rep-${i}`} href={s?.uri || '#'} target="_blank" rel="noreferrer" className="hover:text-blue-500">
                    {s?.title || 'Источник'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
