export default async function handler(req, res) {
  // Твоя строка с ключами — теперь норм
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  const countryList = "Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";

  try {
    // 1. Сразу идем к Gemini (она сама и поисковик, и аналитик)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Gather agricultural market news for the last 7 days for these countries: ${countryList}. 
            Focus on: Sunflower oil, Palm oil, Soybean oil, Rapeseed oil, and Brent Crude.
            
            Structure:
            1. ## EXECUTIVE SUMMARY
            2. ## PRICE DYNAMICS (Status: Pending)
            3. ## PRODUCTION AND TRADE FLOWS (Recent news per country/product)
            4. ## POLICY AND REGULATORY CHANGES
            5. ## CONCLUSIONS
            
            Strictly 2026 data only.`
          }]
        }],
        // Вот эта магия заменяет Tavily
        tools: [{ google_search_retrieval: {} }]
      })
    });

    const data = await response.json();
    
    // Проверка на ошибки от Google
    if (data.error) {
      throw new Error(data.error.message);
    }

    const report = data.candidates[0].content.parts[0].text;
    
    // Возвращаем результат в том же формате, что ждет твой фронтенд
    res.status(200).json({ report, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## CONNECTION ERROR\n${e.message}` });
  }
}
