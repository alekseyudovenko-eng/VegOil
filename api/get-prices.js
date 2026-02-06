export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query;

  const prompts = {
    summary: "Briefly summarize key global oilseed market events for the last 7 days. Focus on CIS and EU.",
    prices: "Provide a quick table of current market prices for Sunflower Oil, Rapeseed Oil, Soy Oil, and Brent Crude.",
    policy: "Report any recent export taxes or trade bans on vegetable oils in Russia, Ukraine, and Kazakhstan."
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompts[section] || prompts.summary }] }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();
    
    // ПРОВЕРКА НА ОШИБКУ ОТ GOOGLE
    if (data.error) {
      return res.status(200).json({ 
        report: `## Ошибка API\n${data.error.message || 'Превышен лимит запросов'}` 
      });
    }

    // БОЛЕЕ ГИБКИЙ ПАРСИНГ ОТВЕТА
    const report = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!report) {
      // Если текста нет, проверим, не заблокирован ли контент фильтрами
      const reason = data.promptFeedback?.blockReason || "Empty response from AI";
      return res.status(200).json({ report: `## Внимание\nНе удалось получить текст: ${reason}` });
    }

    res.status(200).json({ report });
  } catch (e) {
    res.status(200).json({ report: `## Ошибка соединения\n${e.message}` });
  }
}
