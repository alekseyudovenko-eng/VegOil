
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
import type { MergedPriceData } from '../types';

interface PriceChartProps {
  data: MergedPriceData[];
  comparisonLabel?: string | null;
}

const CustomTooltip = ({ active, payload, label, comparisonLabel }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateObj = new Date(label);
    
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-lg text-sm">
        <p className="text-gray-600 font-semibold mb-2">
          {isNaN(dateObj.getTime()) ? label : dateObj.toLocaleString()}
        </p>
        <div className="font-mono text-gray-800 space-y-1">
          <div className="grid grid-cols-2 gap-x-4">
            <p>Open: <span className="font-bold">{data.open.toFixed(2)}</span></p>
            <p>Close: <span className="font-bold text-brand-blue">{data.close.toFixed(2)}</span></p>
            <p>High: <span className="font-bold text-brand-green">{data.high.toFixed(2)}</span></p>
            <p>Low: <span className="font-bold text-brand-red">{data.low.toFixed(2)}</span></p>
          </div>
          {data.comparisonClose != null && comparisonLabel && (
            <p className="mt-2 pt-2 border-t border-gray-100" style={{ color: '#EF5350' }}>
              {comparisonLabel}: <span className="font-bold">{data.comparisonClose.toFixed(2)}</span>
            </p>
          )}
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
        No price data available for chart.
      </div>
    );
  }

  // Если всего одна точка, Recharts может не отрисовать линию. 
  // Мы всё равно передаем массив, но график будет выглядеть как точка.

  const yDomainValues = data.reduce(
    (acc, { low, high, comparisonClose }) => {
      const values = [acc[0], acc[1], low, high];
      if (comparisonClose != null) {
        values.push(comparisonClose);
      }
      return [Math.min(...values), Math.max(...values)];
    },
    [data[0].low, data[0].high],
  );
  
  const domain = [
    yDomainValues[0] * 0.99,
    yDomainValues[1] * 1.01,
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(tick) => {
            const d = new Date(tick);
            if (isNaN(d.getTime())) return tick;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
          stroke="#94A3B8"
          tick={{ fontSize: 11 }}
          dy={10}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          domain={domain}
          orientation="right"
          stroke="#94A3B8"
          tickFormatter={(tick) => tick.toLocaleString()}
          tick={{ fontSize: 11 }}
          dx={5}
        />
        <Tooltip 
          content={<CustomTooltip comparisonLabel={comparisonLabel} />} 
          cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
        />
        <Legend 
          verticalAlign="top" 
          align="right" 
          wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
        />
        <Area 
            type="monotone" 
            dataKey="close" 
            stroke="none" 
            fill="url(#colorClose)" 
            isAnimationActive={true}
        />
        <Line
          name="FCPO Price"
          type="monotone"
          dataKey="close"
          stroke="#2962FF"
          strokeWidth={2.5}
          // Показываем маленькие точки, чтобы одна точка была видна
          dot={{ r: data.length < 5 ? 4 : 0, fill: '#2962FF' }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
          isAnimationActive={true}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
