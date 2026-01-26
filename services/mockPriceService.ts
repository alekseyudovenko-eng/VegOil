import type { PriceData, Timeframe, ComparisonOption } from '../types';

const generateRandomFluctuation = (base: number, volatility: number): number => {
  return base * (1 + (Math.random() - 0.5) * volatility);
};

export const generatePriceData = (timeframe: Timeframe): Promise<PriceData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data: PriceData[] = [];
      let numPoints = 60;
      let interval: 'hour' | 'day' | 'week' = 'day';

      switch (timeframe) {
        case '1D':
          numPoints = 24;
          interval = 'hour';
          break;
        case '1W':
          numPoints = 7;
          interval = 'day';
          break;
        case '1M':
          numPoints = 30;
          interval = 'day';
          break;
        case '6M':
          numPoints = 26; // weeks
          interval = 'week';
          break;
        case '1Y':
          numPoints = 52; // weeks
          interval = 'week';
          break;
      }

      const endDate = new Date();
      let currentDate = new Date(endDate);
      let lastClose = 4000 + Math.random() * 500;

      for (let i = 0; i < numPoints; i++) {
        const open = generateRandomFluctuation(lastClose, 0.02);
        const close = generateRandomFluctuation(open, 0.03);
        const high = Math.max(open, close) * (1 + Math.random() * 0.015);
        const low = Math.min(open, close) * (1 - Math.random() * 0.015);
        
        let dateString = '';
        if (interval === 'hour') {
          currentDate.setHours(endDate.getHours() - i);
          dateString = currentDate.toISOString();
        } else if (interval === 'day') {
          currentDate.setDate(endDate.getDate() - i);
          dateString = currentDate.toISOString().split('T')[0];
        } else { // week
          currentDate.setDate(endDate.getDate() - i * 7);
          dateString = currentDate.toISOString().split('T')[0];
        }
        
        data.push({
          date: dateString,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
        lastClose = close;
      }
      
      resolve(data.reverse());
    }, 800 + Math.random() * 500); // Simulate network latency
  });
};


export const generateComparisonData = (
  timeframe: Timeframe,
  comparison: ComparisonOption,
  referenceData: PriceData[]
): Promise<PriceData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (comparison === 'NONE' || !referenceData || referenceData.length === 0) {
        resolve([]);
        return;
      }

      let basePrice = 4000;
      let volatility = 0.03;

      if (comparison === 'SBO') {
        basePrice = 3200 + Math.random() * 400; // Soybean oil base price
        volatility = 0.04;
      } else if (comparison === 'PREVIOUS_PERIOD') {
        // Simulate a different random walk starting from a point relative to the current data's start
        basePrice = (referenceData[0]?.open || 4000) * (0.9 + Math.random() * 0.2);
        volatility = 0.025;
      }

      let lastClose = basePrice;
      const data = referenceData.map(refPoint => {
        const open = generateRandomFluctuation(lastClose, volatility * 0.8);
        const close = generateRandomFluctuation(open, volatility);
        const high = Math.max(open, close) * (1 + Math.random() * 0.015);
        const low = Math.min(open, close) * (1 - Math.random() * 0.015);
        lastClose = close;

        return {
          date: refPoint.date, // Use the same date for perfect alignment on the chart
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        };
      });
      resolve(data);
    }, 400 + Math.random() * 300); // Shorter latency for comparison data
  });
};
