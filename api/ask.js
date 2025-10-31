export default async function handler(req, res) {
    // --- CORS разрешения ---
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'POST, GET, OPTIONS');
    res.setHeader("Access-Control-Allow-Headers", 'Content-Type');
    
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
        
        // Здесь должна быть интеграция с DeepSeek API
        // Временный заглушка ответа
        const answer = `Я получил ваш вопрос: "${question}". В реальной реализации здесь будет ответ от DeepSeek API.`;
        
        // Имитация обработки
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return res.status(200).json({ 
            answer: answer,
            question: question
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}
