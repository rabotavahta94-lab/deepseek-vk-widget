export default async function handler(req, res) {
    // --- CORS разрешения ---
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'POST, GET, OPTIONS');
    res.setHeader("Access-Control-Allow-Headers", 'Content-Type, Authorization');
    
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
        const { question } = req.body;
        
        if (!question || question.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Пустой запрос',
                message: 'Пожалуйста, введите вопрос'
            });
        }
        
        if (question.length > 2000) {
            return res.status(400).json({
                error: 'Слишком длинный запрос',
                message: 'Максимальная длина вопроса: 2000 символов'
            });
        }
        
        console.log('Получен вопрос:', question.substring(0, 100));
        
        // Получаем API ключ из переменных окружения
        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        
        if (!DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY не настроен');
            return res.status(500).json({
                error: 'API ключ не настроен',
                message: 'Пожалуйста, настройте DEEPSEEK_API_KEY в переменных окружения'
            });
        }
        
        // Вызов реального DeepSeek API
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты полезный AI-ассистент. Отвечай на русском языке понятно и подробно.'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 2048,
                temperature: 0.7,
                stream: false
            })
        });
        
        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('DeepSeek API error:', deepseekResponse.status, errorText);
            
            let errorMessage = 'Ошибка API DeepSeek';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                // Если не удалось распарсить JSON, используем стандартное сообщение
            }
            
            return res.status(deepseekResponse.status).json({
                error: errorMessage,
                status: deepseekResponse.status
            });
        }
        
        const deepseekData = await deepseekResponse.json();
        
        if (!deepseekData.choices || !deepseekData.choices[0] || !deepseekData.choices[0].message) {
            console.error('Неверный формат ответа от DeepSeek API:', deepseekData);
            return res.status(500).json({
                error: 'Неверный формат ответа от AI',
                message: 'Пожалуйста, попробуйте еще раз'
            });
        }
        
        const answer = deepseekData.choices[0].message.content;
        
        console.log('Успешный ответ от DeepSeek API, длина:', answer.length);
        
        return res.status(200).json({ 
            answer: answer,
            question: question,
            timestamp: new Date().toISOString(),
            usage: deepseekData.usage,
            responseId: Math.random().toString(36).substring(2, 9)
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            message: error.message || 'Пожалуйста, попробуйте еще раз позже'
        });
    }
}
