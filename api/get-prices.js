export default async function handler(req, res) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  const currentYear = new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const countryList = "Azerbaijan, Armenia, Belarus, Bulgaria, Czech Republic, Croatia, Estonia, France, Germany, Great Britain, Georgia, Hungary, Italy, Kazakhstan, Kyrgyzstan, Latvia, Lithuania, Moldova, Netherlands, Poland, Romania, Russia, Slovakia, Tajikistan, Turkmenistan, Ukraine, Uzbekistan";

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `Market news Feb 2026: ${countryList} agriculture production, trade flows, export taxes, biofuel policy, palm soy sunflower rapeseed oil news`,
        search_depth: "advanced",
        max_results: 20,
        days: 7,
        exclude_domains: ["facebook.com", "linkedin.com", "x.com"]
      })
    });
    
    const sData = await searchRes.json();
    const context = sData.results?.map(r => `SOURCE: ${r.url} | TITLE: ${r.title} | CONTENT: ${r.content}`).join("\n\n");

    const groqReport = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Используем мощную модель для сложной классификации
        messages: [
          { 
            role: "system", 
            content: `You are a Senior Commodity Analyst. Today is ${dateStr}.
            
            STRUCTURE YOUR REPORT INTO THESE 5 SECTIONS:

            1. ## EXECUTIVE SUMMARY
            Provide a high-level overview of the most critical market shifts today.

            2. ## PRICE DYNAMICS
            [System Note: Pending real-time data integration. All values on hold.]

            3. ## PRODUCTION AND TRADE FLOWS
            For each relevant country from the list (${countryList}) and products (Palm, Soy, Sun, Rape, Cottonseed Oils, Brent), provide ONE key news item regarding harvests, logistics, or export volumes from the last 7 days.
            Format: [COUNTRY/PRODUCT] | [DATE] : [Summary] (Source)

            4. ## POLICY AND REGULATORY CHANGES
            For each relevant country and product, provide ONE key news item regarding government interventions, taxes, subsidies, or biofuel mandates from the last 7 days.
            Format: [COUNTRY/PRODUCT] | [DATE] : [Summary] (Source)

            5. ## CONCLUSIONS
            Briefly state the net impact on global edible oil markets.

            STRICT RULES:
            - Only news from ${currentYear}.
            - If no news for a specific country exists in context, omit that country.
            - Professional, dry, terminal-style tone.` 
          },
          { role: "user", content: `Context: ${context}` }
        ],
        temperature: 0.1
      })
    });

    const gData = await groqReport.json();
    res.status(200).json({ report: gData.choices?.[0]?.message?.content, chartData: [] });

  } catch (e) {
    res.status(200).json({ report: `## ERROR\n${e.message}` });
  }
}
