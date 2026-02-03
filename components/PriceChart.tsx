import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from 'recharts';

const PriceChart = ({ data }: { data: any[] }) => {
  // Если данных нет или это не массив - не ломаем приложение
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">
        Ожидание рыночных данных...
      </div>
    );
  }

  // Очистка данных: убираем битые записи и приводим к числам
  const cleanData = data
    .map(d => ({
      ...d,
      close: parseFloat(d.close),
      // Форматируем дату, чтобы не было гигантских строк
      displayDate: d.date ? d.date.split('-').slice(1).join('/') : ''
    }))
    .filter(d => !isNaN(d.close));

  const prices = cleanData.map(d => d.close);
  const minP = Math.min(...prices) * 0.98;
  const maxP = Math.max(...prices) * 1.02;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={cleanData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey="displayDate" 
          tick={{fontSize: 12}} 
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          domain={[minP, maxP]} 
          hide={true} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          labelStyle={{ color: '#64748b' }}
        />
        <Line 
          type="linear" // Убираем monotone (сглаживание), оно часто дает ошибку "arc flag"
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} 
          activeDot={{ r: 6 }}
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
