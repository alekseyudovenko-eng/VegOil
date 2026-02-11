export default async function handler(req, res) {
  // 1. ПРОВЕРКА КЛЮЧЕЙ
  console.log("Keys check:", { 
    hasGroq: !!process.env.VITE_GROQ_API_KEY, 
    hasTavily: !!process.env.TAVILY_API_KEY 
  });

  const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
  const TAVILY_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_KEY || !TAVILY_KEY) {
    return res.status(500).json({ error: "Missing API keys in Environment Variables" });
  }

  try {
    // 2. ПОИСК ДАННЫХ
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: "sunflower oil price Russia export duty February 2026, FOB Novorossiysk, palm oil BMD, rapeseed MATIF",
        search_depth: "advanced",
        max_results: 10
      })
    });
    
    const searchData = await searchRes.json();
    const context = JSON.stringify(searchData.results);

    // 3. ЗАПРОС К GROQ (ОДИН, НО МОЩНЫЙ)
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
            НИКАКИХ АКЦИЙ APPLE, TESLA И S&P 500.

            Твои опорные данные на Февраль 2026 (используй их, если поиск дал мало инфы):
            - Пошлина РФ: 9 495 руб/т.
            - Подсолнечное масло (FOB Новороссийск): ~$1,275/т.
            - Рапс (MATIF): ~486 евро.
            - Пальма (BMD): ~4,100 MYR.

            СТРУКТУРА ОТЧЕТА (Markdown):
            1. ЦЕНЫ FOB/CIF (Февраль 2026): Укажи цены на подсолнечное масло, Рапс, Пальму.
            2. ПОШЛИНЫ (РФ): Обязательно укажи пошлину 9 495 руб/т.
            3. ЛОГИСТИКА: Ситуация в портах Черного моря.
            4. ТАБЛИЦА ЦЕН: Сравнение с январем 2026.`
          },
          { 
            role: "user", 
            content: `Данные из сети: ${context}` 
          }
        ],
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
        throw new Error(`Groq Error: ${data.error.message}`);
    }
    
    res.status(200).json({ report: data.choices[0].message.content });

  } catch (error) {
    console.error("Handler Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
