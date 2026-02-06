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
            text: `Act as a professional Commodity Analyst. 
            Conduct a DEEP SEARCH and provide a detailed market report for February 2026.
            COUNTRIES TO COVER: ${countryList}.

            STRUCTURE:
            1. ## EXECUTIVE SUMMARY (Global trends)
            2. ## REGIONAL ANALYSIS (Detailed news for: CIS & Russia, European Union, Central Asia)
            - Mention specific trade flows or crop conditions for at least 5-7 key countries from the list.
            3. ## PRODUCT SPECIFIC (Sunflower, Palm, Soybean, Rapeseed oils + Brent)
            4. ## POLICY AND REGULATORY (Taxes, quotas, or bans in the listed countries)
            5. ## CONCLUSIONS

            STRICT RULE: Focus on the last 7 days. If specific data for a country is missing, mention the regional trend.`
          }]
        }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ 
        report: `## API ERROR\nCode: ${data.error.code}\nMessage: ${data.error.message}` 
      });
    }

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated.";

    // Добавляем данные для графиков (Brent и Масло)
    // В будущем мы научим Gemini вытаскивать эти цифры из текста
    const chartData = [
      { date: '01.02', brent: 82.1, oil: 950 },
      { date: '02.02', brent: 83.5, oil: 955 },
      { date: '03.02', brent: 81.8, oil: 940 },
      { date: '04.02', brent: 84.2, oil: 965 },
      { date: '05.02', brent: 83.9, oil: 960 },
    ];
    
    res.status(200).json({ report, chartData });

  } catch (e) {
    res.status(200).json({ report: `## CONNECTION ERROR\n${e.message}` });
  }
}
