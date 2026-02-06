export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  const countryList = "Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";

  // Динамическое определение текущей даты
  const now = new Date();
  const currentMonthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Например: "March 2026"
  const fullDate = now.toDateString(); // Например: "Fri Mar 06 2026"

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `YOU ARE A SPECIALIZED EDIBLE OILS & OILSEEDS ANALYST. 
            TODAY'S DATE: ${fullDate}.
            
            TASK: Generate an exhaustive market intelligence report for THE LAST 7 DAYS.
            
            STRICT FOCUS: Only Oilseeds and Vegetable Oils (Sunflower, Rapeseed, Soybean, Palm).
            EXCLUDE: All grains (Wheat, Corn, Barley, etc.).
            
            REQUIRED REGIONAL COVERAGE:
            Analyze major news for these specific countries: ${countryList}.
            
            FOR EACH REGION, YOU MUST FIND AND REPORT:
            - PRICES: Specific price points for Crude Sunflower Oil (SFO), Rapeseed Oil (RSO), and Soybean Oil (SBO).
            - SEEDS: Market situation for sunflower seeds, rapeseed, and soybeans (crushing margins, stocks).
            - LOGISTICS: Export duties (especially Russia/Kazakhstan), port activity in the Black Sea and EU.
            - BRENT CRUDE: Impact on the Biofuel sector and vegetable oil prices.

            REPORT STRUCTURE:
            ## 1. VEGETABLE OILS GLOBAL OVERVIEW (Brent Crude vs Edible Oils)
            ## 2. CIS & RUSSIA OILSEEDS SECTOR (Detailed news, duties, and prices)
            ## 3. EU & UK OILSEEDS SECTOR (Detailed news, crushing activity, and prices)
            ## 4. PRICE SUMMARY TABLE (List all found prices for oils and seeds)
            ## 5. POLICY & REGULATORY CHANGES
            ## 6. SHORT-TERM OUTLOOK
            
            STRICT RULES: 
            - USE ONLY NEWS FROM ${currentMonthYear} (focus on the latest week).
            - Focus strictly on the oilseed complex.
            - Cold, analytical, professional tone.`
          }]
        }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated.";
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
