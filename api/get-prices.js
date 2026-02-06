export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  const prompt = `
    Create a professional oilseed market report for today, Feb 6, 2026.
    Structure:
    ## Market Sentiment: 2 paragraphs about global trends (CIS, EU).
    ## Price Benchmarks: A list of prices for Sunflower Oil (FOB Black Sea), Rapeseed Oil (FOB Dutch), and Brent.
    ## Policy & Logistics: Update on duties and freight.
    Be concise but professional.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],         
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "Нет данных";
    res.status(200).json({ report });
  } catch (e) {
    // Если Google Search забанил IP Vercel, возвращаем хотя бы что-то
    res.status(200).json({ report: `## Временное ограничение\nGoogle превысил лимит запросов для этого региона. Попробуйте через минуту.\n\n(Системная ошибка: ${e.message})` });
  }
}
