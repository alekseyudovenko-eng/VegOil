// api/scrape-history.js
import { supabase } from '../lib/supabase.js';

// Парсим IndexMundi для исторических данных
const scrapeIndexMundi = async (commodity = 'sunflower-oil') => {
  try {
    const url = `https://www.indexmundi.com/commodities/?commodity=${commodity}&months=12`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Ищем таблицу с данными
    // Структура: <table class="tblData"> с месяцами и ценами
    const tableMatch = html.match(/<table[^>]*class="tblData"[^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) return [];
    
    const tableHtml = tableMatch[1];
    const rows = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
    
    const historicalData = [];
    
    rows.forEach(row => {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
      if (cells && cells.length >= 2) {
        const month = cells[0].replace(/<[^>]*>/g, '').trim();
        const priceText = cells[1].replace(/<[^>]*>/g, '').trim();
        const price = parseFloat(priceText);
        
        if (month && !isNaN(price)) {
          // Преобразуем "Jan 2026" в дату
          const date = new Date(month);
          if (!isNaN(date.getTime())) {
            historicalData.push({
              product: commodity === 'sunflower-oil' ? 'Sunflower Oil' : 
                       commodity === 'palm-oil' ? 'Palm Oil' : 'Soybean Oil',
              price: price,
              currency: 'USD',
              unit: 'metric tonne',
              date: date.toISOString().split('T')[0],
              source: 'IndexMundi/WorldBank',
              region: 'Global',
              month: month
            });
          }
        }
      }
    });
    
    return historicalData.reverse(); // От старого к новому
  } catch (error) {
    console.error('IndexMundi scraping error:', error);
    return [];
  }
};

export default async function handler(req, res) {
  const { commodity } = req.query;
  
  const data = await scrapeIndexMundi(commodity || 'sunflower-oil');
  
  // Сохраняем в БД
  if (data.length > 0) {
    const { error } = await supabase
      .from('prices')
      .upsert(data, { onConflict: ['product', 'region', 'date'] });
      
    if (error) {
      console.error('Database save error:', error);
    }
  }
  
  res.status(200).json({
    success: true,
    data,
    count: data.length,
    commodity: commodity || 'sunflower-oil'
  });
}
