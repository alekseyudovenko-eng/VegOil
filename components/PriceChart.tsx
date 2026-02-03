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
} from 'recharts';

const PriceChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400">No data</div>;
  }

  // Фильтруем значения для корректного Domain
  const vals = data.flatMap(d => [d.open, d.high, d.low, d.close]).filter(v => typeof v === 'number');
  const minV = Math.min(...vals) * 0.99;
  const maxV = Math.max(...vals) * 1.01;

  return (
    /* minWidth: 0 решает проблему в некоторых браузерах */
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={400}>
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="date" hide={false} tick={{fontSize: 10}} stroke="#94A3B8" />
        <YAxis 
          domain={[minV, maxV]} 
          orientation="right" 
          tick={{fontSize: 10}} 
          stroke="#94A3B8" 
          width={40}
        />
        <Tooltip />
        <Area type="monotone" dataKey="close" stroke="none" fill="#2962FF" fillOpacity={0.1} />
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2962FF" 
          strokeWidth={2} 
          dot={{ r: 4 }} 
          activeDot={{ r: 6 }} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
