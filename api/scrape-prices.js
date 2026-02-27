// api/scrape-prices.js
import { supabase } from '../lib/supabase.js';

// Парсим Cbonds.ru - FOB Черное море
const scrapeCbonds = async () => {
  try {
    const response = await fetch('https://cbonds.ru/glossary/commodities', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const html = await response.text();
    
    // Ищем цены на масла в HTML
    // Структура Cbonds: таблица с commodities
    const prices = {};
    
    // Подсолнечное масло FOB Азово-Черноморский бассейн
    const sunflowerMatch = html.match(/Подсолнечное масло.*?FOB[^0-9]*([0-9,]+)/i);
    if (sunflowerMatch) {
      prices.sunflowerOilFOB = {
        product: 'Sunflower Oil',
        price: parseFloat(sunflowerMatch[1].replace(',', '.')),
        unit: 'USD/tonne',
        region: 'Azov-Black Sea',
        source: 'Cbonds',
        date: new Date().toISOString().split('T')[0]
      };
    }
    
    // Подсолнечное масло FOB Новороссийск
    const novorossiyskMatch = html.match(/Новороссийск[^0-9]*([0-9,]+)/i);
    if (novorossiyskMatch && !prices.sunflowerOilFOB) {
      prices.sunflowerOilFOB_Novorossiysk = {
        product: 'Sunflower Oil',
        price: parseFloat(novorossiyskMatch[1].replace(',', '.')),
        unit: 'USD/tonne',
        region: 'Novorossiysk',
        source: 'Cbonds',
        date: new Date().toISOString().split('T')[0]
      };
    }
    
    // Соевое масло FOB Аргентина
    const soybeanMatch = html.match(/Соевое масло.*?FOB[^0-9]*([0-9,]+)/i);
    if (soybeanMatch) {
      prices.soybeanOilFOB = {
        product: 'Soybean Oil',
        price: parseFloat(soybeanMatch[1].replace(',', '.')),
        unit: 'USD/tonne',
        region: 'Argentina',
        source: 'Cbonds',
        date: new Date().toISOString().split('T')[0]
      };
    }
    
    // Пальмовое масло (если есть)
    const palmMatch = html.match(/Пальмовое масло[^0-9]*([0-9,]+)/i);
    if (palmMatch) {
      prices.palmOil = {
        product: 'Palm Oil',
        price: parseFloat(palmMatch[1].replace(',', '.')),
        unit: 'USD/tonne',
        region: 'Malaysia/Indonesia',
        source: 'Cbonds',
        date: new Date().toISOString().split('T')[0]
      };
    }
    
    return prices;
  } catch (error) {
    console.error('Cbonds scraping error:', error);
    return {};
  }
};

// Сохраняем в Supabase
const saveToDatabase = async (prices) => {
  const records = Object.values(prices).map(price => ({
    ...price,
    created_at: new Date().toISOString()
  }));
  
  if (records.length === 0) return;
  
  const { data, error } = await supabase
    .from('prices')
    .upsert(records, { onConflict: ['product', 'region', 'date'] });
    
  if (error) {
    console.error('Database error:', error);
  }
  
  return data;
};

export default async function handler(req, res) {
  // Имитируем задержку для реалистичности
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const prices = await scrapeCbonds();
  await saveToDatabase(prices);
  
  res.status(200).json({ 
    success: true, 
    prices,
    scrapedAt: new Date().toISOString(),
    note: 'Data scraped from Cbonds.ru'
  });
}
