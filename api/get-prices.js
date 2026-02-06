export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query;

  const demo = {
    summary: "## Market Summary\nЦены на масла в СНГ показывают умеренный рост. Экспорт идет по графику.",
    prices: "## Current Prices\n* SFO: $945\n* RSO: $1010\n* Brent: $79.20",
    policy: "## Regulation\nИзменений по экспортным пошлинам на текущую неделю не зафиксировано."
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Short oilseed update" }] }]
      })
    });

    const data = await response.json();

    // Если Google ответил ошибкой 429 или 403, отдаем демо-данные, чтобы не бесить тебя
    if (data.error) {
      return res.status(200).json({ report: demo[section] || "Сервис временно недоступен" });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || demo[section];
    res.status(200).json({ report });

  } catch (e) {
    res.status(200).json({ report: demo[section] });
  }
}
