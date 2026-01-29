export default async function handler(req, res) {
  const { timeframe } = req.query;
  const key = process.env.VITE_OPENROUTER_API_KEY;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key.trim()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vegoil-app.vercel.app",
        "X-Title": "VegOil"
      },
      body: JSON.stringify({
        // Пробуем сменить на мощную модель, чтобы исключить проблемы с поиском
        model: "perplexity/llama-3.1-sonar-large-128k-online", 
        messages: [{ 
          role: "user", 
          content: `Find FCPO prices on Bursa Malaysia for ${timeframe}. Output ONLY JSON: {"prices": [{"date": "YYYY-MM-DD", "open": 100, "high": 110, "low": 90, "close": 105}]}` 
        }]
      })
    });

    const data = await response.json();
    
    // Если OpenRouter вернул ошибку, выводим её статус
    if (data.error) {
      return res.status(200).json({ 
        isError: true, 
        message: data.error.message || "Unknown OpenRouter Error" 
      });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ isError: true, message: error.message });
  }
}
