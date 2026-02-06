export default async function handler(req, res) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  try {
    // Запрашиваем список всех доступных моделей
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ 
        report: `## Ошибка ключа\nКод: ${data.error.code}\n${data.error.message}` 
      });
    }

    // Выводим список имен моделей
    const modelList = data.models.map(m => m.name.replace('models/', '')).join('\n* ');
    res.status(200).json({ 
      report: `## Доступные модели:\n* ${modelList}` 
    });

  } catch (e) {
    res.status(200).json({ report: `## Ошибка\n${e.message}` });
  }
}
