export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const countryList = "Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";

  // Динамическая дата
  const now = new Date();
  const fullDate = now.toDateString();

  try {
    // ИСПОЛЬЗУЕМ gemini-1.5-flash-latest — это самая стабильная точка входа
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Act as a professional Commodity Analyst. Today is ${fullDate}.
            Provide a detailed market report for the last 7 days on Oilseeds and Vegetable Oils (Sunflower, Rapeseed, Soybean, Palm).
            Countries: ${countryList}.
            Exclude: Grains.
            Structure: Use H2 for sections. Focus on prices, export duties, and Brent Crude.`
          }]
        }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();

    if (data.error) {
      // Если это снова квота, возвращаем 429, если другая ошибка — 500
      const status = data.error.code === 429 ? 429 : 500;
      return res.status(status).json({ 
        report: `## API ERROR\n${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated.";
    
    // Возвращаем отчет и наш "статичный бред" (графики)
    res.status(200).json({ 
      report, 
      chartData: [
        { date: '01.02', brent: 82.1, oil: 950 },
        { date: '02.02', brent: 83.5, oil: 955 },
        { date: '03.02', brent: 81.8, oil: 940 },
        { date: '04.02', brent: 84.2, oil: 965 },
        { date: '05.02', brent: 83.9, oil: 960 }
      ] 
    });

  } catch (e) {
    res.status(500).json({ report: `## CONNECTION ERROR\n${e.message}` });
  }
}
