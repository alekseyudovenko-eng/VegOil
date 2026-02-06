export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  const countryList = "Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Gather agricultural market news for February 2026 for these countries: ${countryList}. 
            Focus on: Sunflower oil, Palm oil, Soybean oil, Rapeseed oil, and Brent Crude.
            Structure:
            1. ## EXECUTIVE SUMMARY
            2. ## PRODUCTION AND TRADE FLOWS
            3. ## POLICY AND REGULATORY CHANGES
            4. ## CONCLUSIONS`
          }]
        }],
        // ИСПРАВЛЕНО: Теперь используем актуальное название инструмента
        tools: [{
          google_search: {} 
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ 
        report: `## API ERROR\nCode: ${data.error.code}\nMessage: ${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated.";
    res.status(200).json({ report, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## CONNECTION ERROR\n${e.message}` });
  }
}
