export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query;

  const prompts = {
    summary: "Briefly summarize global oilseed market events for the last 7 days. Focus on CIS and EU.",
    prices: "Provide a quick table of current market prices for Sunflower Oil, Rapeseed Oil, Soy Oil, and Brent Crude.",
    policy: "Report any recent export taxes or trade bans on vegetable oils in Russia, Ukraine, and Kazakhstan."
  };

  // ВАЖНО: используем модель gemini-1.5-flash (самая стабильная в v1beta)
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

  try {
    const response = await fetch(url, {
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
        report: `## Ошибка API\nКод: ${data.error.code}\n${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!report) {
      return res.status(200).json({ report: "## Ошибка\nПустой ответ. Возможно, сработали фильтры безопасности Google." });
    }

    res.status(200).json({ report });
  } catch (e) {
    res.status(200).json({ report: `## Ошибка соединения\n${e.message}` });
  }
}
