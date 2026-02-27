// api/get-prices.js
import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  const { region, topic, days = 10 } = req.query;
  
  // Имитируем задержку сервера
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    // Получаем данные из нашей БД (куда сохраняли парсеры)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const { data: prices, error } = await supabase
      .from('prices')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    // Если в БД мало данных — возвращаем моки с пометкой
    const hasRealData = prices && prices.length > 0;
    
    // Формируем отчет на основе topic
    const report = generateReport(topic, region, prices, hasRealData);
    
    res.status(200).json({ 
      report,
      meta: {
        region,
        topic,
        dataPoints: prices?.length || 0,
        hasRealData,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    // Fallback на моки если БД недоступна
    const mockReport = generateMockReport(topic, region);
    res.status(200).json({
      report: mockReport,
      meta: { region, topic, hasRealData: false, error: error.message }
    });
  }
}

// Генерация отчета с реальными данными
function generateReport(topic, region, prices, hasRealData) {
  const priceTable = hasRealData ? formatPriceTable(prices) : '*Данные собираются...*';
  
  const dataMap = {
    news: {
      title: "Оперативные новости",
      content: `* **${region}:** Анализ рынка на основе собранных данных.\n* **Цены:** ${hasRealData ? 'Актуальные котировки FOB' : 'В процессе сбора'}.\n* **Источник:** Cbonds.ru, IndexMundi.`
    },
    prices: {
      title: "Котировки и индикаторы",
      content: priceTable
    },
    trade: {
      title: "Экспорт и импорт",
      content: `Данные по региону **${region}**. ${hasRealData ? 'Статистика на основе собранных цен FOB.' : 'Сбор данных...'}`
    },
    policy: {
      title: "Регуляторная политика",
      content: `Анализ регуляторных изменений в регионе **${region}**.`
    }
  };

  const selected = dataMap[topic] || dataMap.news;
  
  const dataStatus = hasRealData 
    ? '> **Данные собраны автоматически** из открытых источников (Cbonds, IndexMundi).'
    : '> **Система накопления данных.** Первые реальные данные появятся через 24ч.';

  return `
# ${selected.title}: ${region}
---
${selected.content}

${dataStatus}

*Последнее обновление: ${new Date().toLocaleString('ru-RU')}*
  `;
}

function formatPriceTable(prices) {
  if (!prices || prices.length === 0) return 'Нет данных';
  
  // Группируем по продукту, берем последнюю цену
  const latest = {};
  prices.forEach(p => {
    const key = `${p.product}_${p.region}`;
    if (!latest[key] || new Date(p.date) > new Date(latest[key].date)) {
      latest[key] = p;
    }
  });
  
  const rows = Object.values(latest).map(p => {
    const change = calculateChange(prices, p.product, p.region);
    return `| ${p.product} | ${p.region} | $${p.price} | ${change} |`;
  }).join('\n');
  
  return `| Продукт | Регион | Цена | Изм. |\n| :--- | :--- | :--- | :--- |\n${rows}`;
}

function calculateChange(allPrices, product, region) {
  // Находим изменение за последние 2 записи
  const productPrices = allPrices
    .filter(p => p.product === product && p.region === region)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
    
  if (productPrices.length < 2) return '—';
  
  const current = productPrices[0].price;
  const previous = productPrices[1].price;
  const diff = current - previous;
  const percent = ((diff / previous) * 100).toFixed(1);
  
  return diff >= 0 ? `📈 +$${diff} (+${percent}%)` : `📉 -$${Math.abs(diff)} (${percent}%)`;
}

function generateMockReport(topic, region) {
  // Ваш текущий мок-контент как fallback
  const dataMap = {
    news: {
      title: "Оперативные новости",
      content: `* **Черноморский регион:** Ожидается рост предложения подсолнечного масла.\n* **Индия:** Снижение импортной пошлины подтверждено.\n* **Логистика:** Фрахт из портов ${region} стабилен.`
    },
    prices: {
      title: "Котировки и индикаторы",
      content: `| Продукт | Цена FOB | Изм. за неделю | Прогноз |\n| :--- | :--- | :--- | :--- |\n| Sun Oil | $945 | +$15 | 📈 |\n| Palm Oil | $890 | -$5 | 📉 |\n| Soy Oil | $1010 | +$2 | ➡️ |`
    },
    trade: {
      title: "Экспорт и импорт",
      content: `Экспортные отгрузки из региона **${region}** за текущий месяц составили 450 тыс. тонн. Основные направления: Китай (40%), Египет (25%), ЕС (15%).`
    },
    policy: {
      title: "Регуляторные изменения",
      content: `В регионе **${region}** вступают в силу новые требования к содержанию 3-MCPD. Экспортная пошлина остается на уровне 0% до конца квартала.`
    }
  };

  const selected = dataMap[topic] || dataMap.news;
  
  return `
# ${selected.title}: ${region}
---
${selected.content}

> **Система работает в режиме накопления данных.** Реальные котировки появятся после первого сбора (24ч).

*Статус: SIMULATION_MODE*
  `;
}
