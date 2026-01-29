// api/get-prices.js
export default async function handler(req, res) {
  const { timeframe } = req.query;
  const key = process.env.VITE_OPENROUTER_API_KEY;

  const prompt = `Search online for FCPO (Crude Palm Oil) daily prices on Bursa Malaysia for the last ${timeframe}. 
  Current date: ${new Date().toDateString()}. 
  Return ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number}]}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app",
      },
      body: JSON.stringify({
        model: "perplexity/llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
