import React from 'react';
import type { Timeframe } from '../types';

interface TimeframeSelectorProps {
  timeframes: Timeframe[];
  activeTimeframe: Timeframe;
  onSelect: (timeframe: Timeframe) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ timeframes, activeTimeframe, onSelect }) => {
  return (
    <div className="flex items-center bg-light-secondary p-1 rounded-lg">
      {timeframes.map((timeframe) => (
        <button
          key={timeframe}
          onClick={() => onSelect(timeframe)}
          className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
            activeTimeframe === timeframe
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-light-tertiary hover:text-gray-800'
          }`}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;