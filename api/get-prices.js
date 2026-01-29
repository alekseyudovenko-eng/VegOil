export default async function handler(req, res) {
  const key = process.env.VITE_GROQ_API_KEY;
  
  if (!key) {
    return res.status(200).send("ОШИБКА: Ключ VITE_GROQ_API_KEY не прописан в настройках Vercel!");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: "Say 'IT WORKS' and nothing else." }]
      })
    });
    
    const data = await response.json();
    const result = data.choices[0].message.content;
    res.status(200).send(result);
  } catch (e) {
    res.status(200).send("ОШИБКА СЕРВЕРА: " + e.message);
  }
}
