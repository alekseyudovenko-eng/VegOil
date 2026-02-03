export default async function handler(req, res) {
  const key = process.env.VITE_GROQ_API_KEY;

  if (!key) {
    return res.status(200).json({ summary: "ОШИБКА: Ключ не найден в настройках Vercel" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Jan 29 2026 market summary Europe CIS. JSON format: {\"summary\": \"...\"}" }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ summary: "Ошибка Groq: " + data.error.message });
    }

    res.status(200).json(JSON.parse(data.choices[0].message.content));
  } catch (e) {
    res.status(200).json({ summary: "Ошибка сервера: " + e.message });
  }
}
