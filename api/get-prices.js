export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query;

  const prompts = {
    summary: "Briefly summarize key global oilseed market events for the last 7 days. Focus on CIS and EU.",
    prices: "Provide a quick table of current market prices for Sunflower Oil, Rapeseed Oil, Soy Oil, and Brent Crude. Focus on Feb 2026.",
    policy: "Report any recent export taxes or trade bans on vegetable oils in Russia, Ukraine, and Kazakhstan."
  };

  try {
    // МЕНЯЕМ МОДЕЛЬ НА 1.5-FLASH
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompts[section] || prompts.summary }] }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ 
        report: `## Ошибка API\n${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!report) {
      return res.status(200).json({ report: "## Ошибка\nМодель не вернула текст. Попробуйте еще раз." });
    }

    res.status(200).json({ report });
  } catch (e) {
    res.status(200).json({ report: `## Ошибка соединения\n${e.message}` });
  }
}
