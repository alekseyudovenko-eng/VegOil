export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: "Search for today's (Feb 6, 2026) vegetable oil prices, Russian export duties, and Brent oil. Create a professional market report with tables." }] 
        }],
        tools: [{ google_search: {} }] // ВОЗВРАЩАЕМ ЖИВОЙ ПОИСК
      })
    });

    const data = await response.json();

    if (data.error) {
      // Если лимит превышен, мы прямо об этом говорим
      return res.status(200).json({ 
        report: `## Ошибка API: ${data.error.code}\n${data.error.message}\n\n*Совет: Google блокирует частые поисковые запросы. Попробуй через 2-3 минуты.*` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.status(200).json({ report: report || "ИИ не смог собрать данные." });

  } catch (e) {
    res.status(200).json({ report: "Ошибка сети при запросе к Google API." });
  }
}
