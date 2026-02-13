export default async function handler(req, res) {
  const { category } = req.query;
  const SERPER_KEY = process.env.SERPER_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (!SERPER_KEY || !GROQ_KEY) return res.status(200).json({ report: "### Config Error." });

  const today = new Date();
  const currentMonthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const configs = {
    news: {
      // Мы добавляем ключевые слова-магниты (duty, price, logistics), которые заставляют Google News показывать цифры в превью
      query: `vegetable oil market news logistics finance Russia Uzbekistan Kazakhstan Europe Middle Corridor ${currentMonthYear} price duty freight`,
      system: `You are an Investigative Market Analyst. 
      Your goal is to build a detailed intelligence report. 
      DON'T GUESS. If the search results show specific numbers (prices, taxes, dates), highlight them. 
      If you see logistics data (port names, shipping lines, rail routes), extract it.
      Structure the report by regions as requested, focusing on FACTS found in the search snippets.`
    }
  };

  const current = configs[category] || configs.news;

  try {
    // Используем /search вместо /news, так как он дает более глубокие сниппеты из аналитических статей
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        q: current.query, 
        num: 50, // Берем 50 результатов, чтобы увеличить объем данных для анализа
        tbs: "qdr:w2" // Строго за последние 2 недели
      })
    });

    const searchData = await serperRes.json();

    // Собираем всё: органику, новости и даже блок "люди также спрашивают"
    const snippets = [
      ...(searchData.organic || []).map(o => `[Source: ${o.link}] ${o.title}: ${o.snippet}`),
      ...(searchData.news || []).map(n => `[News: ${n.date}] ${n.title}: ${n.snippet}`),
      ...(searchData.peopleAlsoAsk || []).map(p => `Question: ${p.question} Answer: ${p.snippet}`)
    ].join("\n\n");

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `${current.system}. Current Date: ${today.toISOString().split('T')[0]}` },
          { role: "user", content: `Analyze these search snippets and provide a deep dive report. Extract every possible fact, number, and logistics detail: \n\n${snippets}` }
        ],
        temperature: 0.1
      })
    });

    const aiData = await groqRes.json();
    res.status(200).json({ report: aiData.choices[0].message.content });

  } catch (error) {
    res.status(200).json({ report: `### Error: ${error.message}` });
  }
}
