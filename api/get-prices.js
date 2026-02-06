export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query;

  const prompts = {
    summary: "Briefly summarize key global oilseed market events for the last 7 days. Focus on CIS and EU. Avoid grains.",
    prices: "Provide a table of current market prices for Sunflower Oil, Rapeseed Oil, Soy Oil, and Brent Crude for Feb 2026.",
    policy: "Report recent export taxes, quotas, or trade bans on vegetable oils in Russia, Ukraine, and Kazakhstan."
  };

  // ИСПОЛЬЗУЕМ МОДЕЛЬ ИЗ ТВОЕГО СПИСКА
  const modelName = "gemini-2.0-flash";

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompts[section] || prompts.summary }] }],
        tools: [{ google_search: {} }] 
      })
    });

    const data = await response.json();
    
    if (data.error) {
      // Если это квота (429), выводим понятный текст
      const isQuota = data.error.code === 429;
      return res.status(200).json({ 
        report: isQuota 
          ? "## Лимит запросов\nGoogle просит подождать 30 секунд. Нажми кнопку чуть позже." 
          : `## Ошибка API\n${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!report) {
      return res.status(200).json({ report: "## Ошибка\nТекст не сформирован. Попробуй еще раз." });
    }

    res.status(200).json({ report });

  } catch (e) {
    res.status(200).json({ report: `## Ошибка соединения\n${e.message}` });
  }
}
