export default async function handler(req, res) {
  // 1. ТВОЯ ПРОВЕРКА КЛЮЧЕЙ (оставляем обязательно!)
  console.log("Keys check:", { 
    hasGroq: !!process.env.VITE_GROQ_API_KEY, 
    hasTavily: !!process.env.TAVILY_API_KEY 
  });

  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(500).json({ error: "Missing API keys in Environment Variables" });
  }

  // 2. ФОРМИРУЕМ ДАТЫ ДЛЯ ТЕКУЩЕГО ОТЧЕТА
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10);
  const formatDate = (d) => d.toISOString().split('T')[0];
  const dateRange = `${formatDate(startDate)} to ${formatDate(endDate)}`;

  try {
    // 3. УЛУЧШЕННЫЙ ПОИСК (Таргетируем масличные)
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `sunflower oil price FOB Novorossiysk, Russia export duty Feb 2026, palm oil BMD, rapeseed MATIF news ${dateRange}`,
        search_depth: "advanced",
        max_results: 10
      })
    });
    
    const searchData = await searchRes.json();
    const context = JSON.stringify(searchData.results);

    // 4. ЗАПРОС К GROQ С ЖЕСТКИМ ПРОМПТОМ
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `ТЫ — ВЕДУЩИЙ МИРОВОЙ АНАЛИТИК РЫНКА МАСЛИЧНЫХ. 
            НИКАКИХ АКЦИЙ APPLE, TESLA И ИНДЕКСОВ S&P 500. 
            Твоя специализация: подсолнечное, рапсовое, пальмовое и соевое масла.

            СТРУКТУРА ОТЧЕТА:
            1. ЦЕНЫ FOB/CIF (Февраль 2026): Укажи цены на подсолнечное масло (РФ/Украина), Рапс (MATIF/Euronext), Пальма (BMD).
            2. ПОШЛИНЫ (РФ): Обязательно укажи пошлину на февраль 2026 (индикатив: 9 495 руб/т).
            3. ЛОГИСТИЧЕСКИЙ ФАКТОР: Опиши ситуацию в портах Черного моря и Красного моря.
            4. ТАБЛИЦА ЦЕН: Сравни текущие котировки с данными месячной давности.

            Используй только предоставленный контекст. Если данных по какой-то позиции нет — пиши "ДАННЫЕ ОТСУТСТВУЮТ".` 
          },
          { 
            role: "user", 
            content: `Контекст поиска (Новости и котировки): ${context}` 
          }
        ],
        temperature: 0.1 // Низкая температура для точности цифр
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
        throw new Error(`Groq Error: ${data.error.message}`);
    }
    
    // ОТПРАВЛЯЕМ ЧИСТЫЙ MARKDOWN
    res.status(200).json({ report: data.choices[0].message.content });

  } catch (error) {
    console.error("Handler Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
