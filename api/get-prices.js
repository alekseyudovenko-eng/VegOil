export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  const countryList = "Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";

  try {
    // ОБНОВЛЕНО: Используем актуальную модель Gemini 3 Flash
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Gather agricultural market news for the last 7 days for these countries: ${countryList}. 
            Focus on: Sunflower oil, Palm oil, Soybean oil, Rapeseed oil, and Brent Crude.
            
            Structure:
            1. ## EXECUTIVE SUMMARY
            2. ## PRODUCTION AND TRADE FLOWS
            3. ## POLICY AND REGULATORY CHANGES
            4. ## CONCLUSIONS
            
            Strictly February 2026 data.`
          }]
        }],
        tools: [{
          googleSearchRetrieval: {} 
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      // Если модель не найдена, попробуем 2.5 (план Б)
      return res.status(200).json({ 
        report: `## API ERROR\n${data.error.message}\nTry switching to gemini-2.5-flash if preview is not available.` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";
    res.status(200).json({ report, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## CONNECTION ERROR\n${e.message}` });
  }
}
