export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const now = new Date();
  const fullDate = now.toDateString();

  try {
    // Пробуем 1.5-flash для более стабильных лимитов
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze oilseed market (Sunseed, Rapeseed, Soy, Palm) for the last 7 days. Today is ${fullDate}.
            Focus: Prices and Export duties in CIS (Russia, Kazakhstan, Ukraine) and EU.
            Structure: Use H2 for sections. Include a small table with found prices for Brent and Oils.`
          }]
        }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.status(data.error.code === 429 ? 429 : 500).json({ error: data.error });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No data.";
    
    // Пытаемся вытащить цену Brent из текста для сайдбара (простой поиск числа)
    const brentMatch = report.match(/Brent[:\s]*\$?(\d+\.\d+)/i);
    const dynamicBrent = brentMatch ? brentMatch[1] : "Check report";

    res.status(200).json({ report, brent: dynamicBrent });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
}
