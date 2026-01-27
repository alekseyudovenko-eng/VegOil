import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  Area,
  Legend,
} from 'recharts';
import type { PriceData } from '../types'; // Изменили MergedPriceData на PriceData

interface PriceChartProps {
  data: PriceData[]; // Используем PriceData
  comparisonLabel?: string | null;
}

const CustomTooltip = ({ active, payload, label, comparisonLabel }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const dateObj = new Date(label);
    
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-lg text-sm">
        <p className="text-gray-600 font-semibold mb-2">
          {isNaN(dateObj.getTime()) ? label : dateObj.toLocaleDateString()}
        </p>
        <div className="font-mono text-gray-800 space-y-1">
          <p>Open: <span className="font-bold">{item.open?.toFixed(2) || '0.00'}</span></p>
          <p>Close: <span className="font-bold text-blue-600">{item.close?.toFixed(2) || '0.00'}</span></p>
          <p>High: <span className="font-bold text-green-600">{item.high?.toFixed(2) || '0.00'}</span></p>
          <p>Low: <span className="font-bold text-red-600">{item.low?.toFixed(2) || '0.00'}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, comparisonLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 italic">
        No price data available.
      </div>
    );
  }

  // Безопасный расчет диапазона цен для шкалы Y
  const allValues = data.flatMap(d => [d.open, d.close, d.high, d.low].filter(v => v != null));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const domain = [minVal * 0.98, maxVal * 1.02];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          hide={true} // Временно скроем для стабильности
        />
        <YAxis 
          domain={domain} 
          orientation="right" 
          tick={{fontSize: 10}} 
          stroke="#94A3B8"
        />
        <Tooltip content={<CustomTooltip comparisonLabel={comparisonLabel} />} />
        <Area type="monotone" dataKey="close" stroke="none" fill="url(#colorClose)" />
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2962FF" 
          strokeWidth={2} 
          dot={false} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
