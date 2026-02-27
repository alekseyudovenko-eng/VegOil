// api/cron-scrape.js - Только для внутреннего вызова cron!
import { scraperService } from '../services/scraperService.ts';

// Защита: только с секретным ключом
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
  // Проверка авторизации
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Проверка метода
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    // 1. Парсим Cbonds
    const cbondsPrices = await scraperService.scrapeCbonds();
    
    // 2. Сохраняем валидированные
    await scraperService.saveValidPrices(cbondsPrices);
    
    // 3. Парсим историю IndexMundi (раз в день достаточно)
    const hour = new Date().getHours();
    if (hour === 9) { // Только в 9 утра
      await scrapeIndexMundiHistory();
    }

    res.status(200).json({
      success: true,
      cbondsPrices: cbondsPrices.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron scraping failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

async function scrapeIndexMundiHistory() {
  const commodities = ['sunflower-oil', 'palm-oil', 'soybean-oil'];
  
  for (const commodity of commodities) {
    try {
      const response = await fetch(`https://your-app.vercel.app/api/scrape-history?commodity=${commodity}`);
      const data = await response.json();
      console.log(`[IndexMundi] ${commodity}: ${data.count} records`);
    } catch (error) {
      console.error(`[IndexMundi] Failed ${commodity}:`, error);
    }
  }
}
