// services/scraperService.ts

interface PriceRecord {
  product: string;
  price: number;
  currency: string;
  unit: string;
  region: string;
  source: string;
  date: string;
  status?: 'valid' | 'suspicious' | 'error';
  deviation?: number;
}

interface ValidationResult {
  isValid: boolean;
  status: 'valid' | 'suspicious' | 'error';
  deviation?: number;
  reason?: string;
}

// Конфигурация валидации
const VALIDATION_CONFIG = {
  maxDailyChange: 0.50,        // 50% максимальное изменение
  minPrice: 100,               // Минимальная цена (защита от null/0)
  maxPrice: 5000,              // Максимальная цена (защита от ошибок парсинга)
  requiredFields: ['product', 'price', 'region', 'source']
};

export class ScraperService {
  
  // Валидация цены перед сохранением
  async validatePrice(newPrice: PriceRecord, historicalData: PriceRecord[]): Promise<ValidationResult> {
    // 1. Проверка обязательных полей
    for (const field of VALIDATION_CONFIG.requiredFields) {
      if (!newPrice[field] || newPrice[field] === '' || newPrice[field] === 0) {
        return {
          isValid: false,
          status: 'error',
          reason: `Missing required field: ${field}`
        };
      }
    }

    // 2. Проверка диапазона цены
    if (newPrice.price < VALIDATION_CONFIG.minPrice || newPrice.price > VALIDATION_CONFIG.maxPrice) {
      return {
        isValid: false,
        status: 'error',
        reason: `Price ${newPrice.price} out of range [${VALIDATION_CONFIG.minPrice}-${VALIDATION_CONFIG.maxPrice}]`
      };
    }

    // 3. Проверка изменения относительно истории
    const previousPrices = historicalData
      .filter(p => p.product === newPrice.product && p.region === newPrice.region)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (previousPrices.length > 0) {
      const lastPrice = previousPrices[0].price;
      const deviation = Math.abs(newPrice.price - lastPrice) / lastPrice;
      
      if (deviation > VALIDATION_CONFIG.maxDailyChange) {
        return {
          isValid: true, // Данные есть, но подозрительные
          status: 'suspicious',
          deviation: Math.round(deviation * 100),
          reason: `Price change ${(deviation * 100).toFixed(1)}% exceeds threshold ${(VALIDATION_CONFIG.maxDailyChange * 100).toFixed(0)}%`
        };
      }
    }

    return { isValid: true, status: 'valid' };
  }

  // Парсинг Cbonds с валидацией
  async scrapeCbonds(): Promise<PriceRecord[]> {
    try {
      // Получаем историю для валидации (последние 30 дней)
      const { data: historicalData } = await supabase
        .from('prices')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      const response = await fetch('https://cbonds.ru/glossary/commodities', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const html = await response.text();
      const rawPrices = this.extractPricesFromHtml(html);
      
      // Валидируем каждую цену
      const validatedPrices: PriceRecord[] = [];
      
      for (const price of rawPrices) {
        const validation = await this.validatePrice(price, historicalData || []);
        
        validatedPrices.push({
          ...price,
          status: validation.status,
          deviation: validation.deviation
        });

        // Логируем подозрительные
        if (validation.status !== 'valid') {
          console.warn(`[VALIDATION] ${price.product} (${price.region}): ${validation.reason}`);
        }
      }

      return validatedPrices;
    } catch (error) {
      console.error('Scraping failed:', error);
      return [];
    }
  }

  private extractPricesFromHtml(html: string): PriceRecord[] {
    const prices: PriceRecord[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Подсолнечное масло FOB Азово-Черноморский бассейн
    const sunflowerMatch = html.match(/Подсолнечное масло.*?FOB[^0-9]*([0-9,]+)/i);
    if (sunflowerMatch) {
      prices.push({
        product: 'Sunflower Oil',
        price: parseFloat(sunflowerMatch[1].replace(',', '.')),
        currency: 'USD',
        unit: 'metric tonne',
        region: 'Azov-Black Sea',
        source: 'Cbonds',
        date: today
      });
    }
    
    // Новороссийск
    const novorossiyskMatch = html.match(/Новороссийск[^0-9]*([0-9,]+)/i);
    if (novorossiyskMatch) {
      prices.push({
        product: 'Sunflower Oil',
        price: parseFloat(novorossiyskMatch[1].replace(',', '.')),
        currency: 'USD',
        unit: 'metric tonne',
        region: 'Novorossiysk',
        source: 'Cbonds',
        date: today
      });
    }
    
    // Соевое масло
    const soybeanMatch = html.match(/Соевое масло.*?FOB[^0-9]*([0-9,]+)/i);
    if (soybeanMatch) {
      prices.push({
        product: 'Soybean Oil',
        price: parseFloat(soybeanMatch[1].replace(',', '.')),
        currency: 'USD',
        unit: 'metric tonne',
        region: 'Argentina',
        source: 'Cbonds',
        date: today
      });
    }

    return prices;
  }

  // Сохранение только валидных данных
  async saveValidPrices(prices: PriceRecord[]): Promise<void> {
    const validPrices = prices.filter(p => p.status !== 'error');
    
    if (validPrices.length === 0) {
      console.warn('[DB] No valid prices to save');
      return;
    }

    // Сохраняем в основную таблицу
    const { error } = await supabase
      .from('prices')
      .upsert(
        validPrices.map(p => ({
          product: p.product,
          price: p.price,
          currency: p.currency,
          unit: p.unit,
          region: p.region,
          source: p.source,
          date: p.date,
          status: p.status,
          created_at: new Date().toISOString()
        })),
        { onConflict: ['product', 'region', 'date'] }
      );

    if (error) {
      console.error('[DB] Save error:', error);
      throw error;
    }

    // Подозрительные сохраняем в отдельную таблицу для аудита
    const suspicious = prices.filter(p => p.status === 'suspicious');
    if (suspicious.length > 0) {
      await supabase
        .from('price_alerts')
        .insert(suspicious.map(p => ({
          ...p,
          alert_type: 'suspicious_price',
          created_at: new Date().toISOString()
        })));
    }

    console.log(`[DB] Saved ${validPrices.length} prices (${suspicious.length} suspicious)`);
  }
}

export const scraperService = new ScraperService();
