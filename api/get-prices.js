// api/get-prices.js
export default async function handler(req, res) {
  const { timeframe } = req.query;
  // Используем твой ключ Groq из переменных Vercel
  const GROQ_KEY = process.env.VITE_GROQ_API_KEY; 

  const prompt = `Provide estimated historical price data for Crude Palm Oil (FCPO) futures for the period: ${timeframe}. 
  Current date is January 2026. 
  Return ONLY a valid JSON object: {"prices": [{"date": "2026-01-20", "open": 3900, "high": 3950, "low": 3880, "close": 3920}]}.
  Provide at least 10 data points.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Топовая бесплатная модель на Groq
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // Groq идеально это поддерживает
        temperature: 0.1
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
