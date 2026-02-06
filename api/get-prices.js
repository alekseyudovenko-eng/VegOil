export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query;

  const prompts = {
    summary: "Today is Feb 6, 2026. Briefly summarize key global oilseed market events for the last 7 days. Focus on CIS and EU.",
    prices: "Today is Feb 6, 2026. Provide current market prices for Sunflower Oil, Rapeseed Oil, Soy Oil, and Brent Crude in a table.",
    policy: "Today is Feb 6, 2026. Report any recent export taxes or trade bans on vegetable oils in Russia, Ukraine, and Kazakhstan."
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompts[section] || prompts.summary }] }]
        // МЫ УБРАЛИ TOOLS, ЧТОБЫ НЕ БЫЛО ОШИБОК 429
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ 
        report: `## Ошибка API\n${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "Нет данных.";
    res.status(200).json({ report });

  } catch (e) {
    res.status(200).json({ report: `## Ошибка соединения\n${e.message}` });
  }
}
