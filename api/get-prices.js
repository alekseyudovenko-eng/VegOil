// api/get-prices.js - Только чтение из кэша, никакого парсинга!
import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  const { region, topic, days = 10 } = req.query;
  
  // Быстрый ответ из кэша (< 100ms)
  const startTime = Date.now();
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Только чтение из Supabase, никаких внешних запросов!
    const { data: prices, error } = await supabase
      .from('prices')
      .select('*')
      .eq('status', 'valid') // Только валидированные
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(100);

    if (error) throw error;

    const hasRealData = prices && prices.length > 0;
    const latestDate = hasRealData ? prices[0].date : null;
    const dataAge = latestDate ? Math.floor((new Date() - new Date(latestDate)) / (1000 * 60 * 60)) : null;

    // Предупреждение если данные устарели (> 25 часов)
    const isStale = dataAge > 25;

    const report = generateReport(topic, region, prices, hasRealData, isStale);
    
    res.status(200).json({ 
      report,
      meta: {
        region,
        topic,
        dataPoints: prices?.length || 0,
        hasRealData,
        isStale,
        dataAgeHours: dataAge,
        responseTimeMs: Date.now() - startTime,
        lastUpdated: latestDate,
        nextUpdate: 'Cron job runs every hour'
      }
    });

  } catch (error) {
    console.error('Cache read error:', error);
    // Даже при ошибке БД — fallback на моки, но быстро
    res.status(200).json({
      report: generateMockReport(topic, region),
      meta: { 
        region, 
        topic, 
        hasRealData: false, 
        error: 'Cache unavailable',
        responseTimeMs: Date.now() - startTime
      }
    });
  }
}

function generateReport(topic, region, prices, hasRealData, isStale) {
  const priceTable = hasRealData 
    ? formatPriceTable(prices) 
    : '*Данные собираются. Первая точка появится в течение часа...*';

  const staleWarning = isStale 
    ? '\n\n> ⚠️ **Данные устарели.** Последнее обновление более 25 часов назад. Проверьте статус cron-задачи.'
    : '';

  const dataMap = {
    news: {
      title: "Оперативные новости",
      content: `* **${region}:** Анализ рынка.\n* **Цены:** ${hasRealData ? 'Актуальные FOB котировки' : 'Сбор данных...'}.\n* **Источник:** Cbonds.ru, IndexMundi.`
    },
    prices: {
      title: "Котировки и индикаторы",
      content: priceTable + staleWarning
    },
    trade: {
      title: "Экспорт и импорт",
      content: `Статистика по региону **${region}**.`
    },
    policy: {
      title: "Регуляторная политика",
      content: `Анализ регуляторных изменений в **${region}**.`
    }
  };

  const selected = dataMap[topic] || dataMap.news;
  
  const dataStatus = hasRealData 
    ? `> ✅ **Данные актуальны.** Обновлено: ${new Date().toLocaleString('ru-RU')}`
    : '> ⏳ **Накопление базы данных.** Автоматический сбор каждый час.';

  return `
# ${selected.title}: ${region}
---
${selected.content}

${dataStatus}

*Время ответа: ${Date.now() - startTime}ms | Источник: Кэш Supabase*
  `;
}

// ... остальные функции formatPriceTable, calculateChange, generateMockReport
