export default async function handler(req, res) {
    // --- CORS разрешения ---
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'POST, GET, OPTIONS');
    res.setHeader("Access-Control-Allow-Headers", 'Content-Type, Authorization');
    res.setHeader("Access-Control-Allow-Credentials", 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Метод не разрешен',
            allowed: ['POST']
        });
    }
    
    try {
        const { question, timestamp } = req.body;
        
        if (!question || question.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Пустой запрос',
                message: 'Пожалуйста, введите вопрос'
            });
        }
        
        if (question.length > 1000) {
            return res.status(400).json({
                error: 'Слишком длинный запрос',
                message: 'Максимальная длина вопроса: 1000 символов'
            });
        }
        
        console.log('Получен вопрос:', {
            question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
            timestamp: timestamp || new Date().toISOString(),
            length: question.length
        });
        
        // Здесь должна быть интеграция с DeepSeek API
        // Временная реализация с улучшенными ответами
        
        const responses = [
            `Я получил ваш вопрос: "${question}". Это интересная тема! В реальной реализации здесь будет интеллектуальный ответ от DeepSeek AI, основанный на анализе вашего запроса.`,
            `Спасибо за вопрос! "${question}" - важная тема для обсуждения. DeepSeek AI сможет предоставить вам развернутый и полезный ответ.`,
            `Отличный вопрос! По теме "${question}" можно рассказать много интересного. В рабочей версии я подключусь к DeepSeek API для генерации точного ответа.`,
            `Я обработал ваш запрос о "${question}". В реальных условиях DeepSeek AI проанализирует этот вопрос и предоставит содержательный ответ.`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Имитация обработки AI
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
        
        return res.status(200).json({ 
            answer: randomResponse,
            question: question,
            timestamp: new Date().toISOString(),
            responseId: Math.random().toString(36).substring(2, 9)
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            message: 'Пожалуйста, попробуйте еще раз позже'
        });
    }
}
