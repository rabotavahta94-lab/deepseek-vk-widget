export default async function handler(req, res) {
  // --- Разрешаем CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Пустой запрос' });
    }

    // Здесь интеграция с DeepSeek API или OpenAI API
    // 👇 пример запроса
    const apiKey = process.env.DEEPSEEK_API_KEY;

    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Ты помощник для пользователей сообщества ВКонтакте.' },
          { role: 'user', content: question }
        ]
      })
    });

    const result = await aiResponse.json();
    const answer = result?.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ.';

    res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при обработке запроса' });
  }
}
