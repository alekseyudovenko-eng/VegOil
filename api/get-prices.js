export default async function (req, res) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Write a short market summary for Jan 29 2026." }],
        max_tokens: 100
      })
    });
    const data = await response.json();
    // Отправляем чистый текст, чтобы ничего не ломалось при парсинге
    res.status(200).send(data.choices[0].message.content || "No data from Groq");
  } catch (e) {
    res.status(200).send("Ошибка соединения с Groq: " + e.message);
  }
}
