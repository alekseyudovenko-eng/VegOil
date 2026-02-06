export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const { section } = req.query; // Получаем тип раздела (prices, news, policy)

  const prompts = {
    summary: "Briefly summarize global oilseed market trends for the last 7 days. Focus on CIS and EU.",
    prices: "List current prices for Crude Sunflower Oil (SFO), Rapeseed Oil (RSO), Soybean Oil (SBO) and Brent Crude. Use a table.",
    policy: "Report new export duties, taxes, or trade bans for oilseeds in Russia, Ukraine, Kazakhstan and EU for Feb 2026."
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
    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No data found for this section.";
    
    res.status(200).json({ report });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
