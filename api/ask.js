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
        
        // Вариант 1: Использование бесплатного OpenAI-совместимого API (Together AI)
        const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
        
        if (TOGETHER_API_KEY) {
            try {
                const togetherResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOGETHER_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
                        messages: [
                            {
                                role: 'system',
                                content: 'Ты полезный AI-ассистент. Отвечай на русском языке понятно и подробно. Будь дружелюбным и помогай пользователю.'
                            },
                            {
                                role: 'user',
                                content: question
                            }
                        ],
                        max_tokens: 1024,
                        temperature: 0.7,
                        stream: false
                    })
                });
                
                if (togetherResponse.ok) {
                    const togetherData = await togetherResponse.json();
                    if (togetherData.choices && togetherData.choices[0] && togetherData.choices[0].message) {
                        return res.status(200).json({ 
                            answer: togetherData.choices[0].message.content,
                            question: question,
                            timestamp: new Date().toISOString(),
                            provider: 'together',
                            responseId: Math.random().toString(36).substring(2, 9)
                        });
                    }
                }
            } catch (togetherError) {
                console.log('Together AI не доступен, используем локальную логику:', togetherError.message);
            }
        }
        
        // Вариант 2: Умный демо-режим с улучшенными ответами
        const improvedAnswer = await generateImprovedAnswer(question);
        
        return res.status(200).json({ 
            answer: improvedAnswer,
            question: question,
            timestamp: new Date().toISOString(),
            provider: 'improved_demo',
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

// Улучшенный генератор ответов
async function generateImprovedAnswer(question) {
    // Простая логика для разных типов вопросов
    const lowerQuestion = question.toLowerCase();
    
    // Приветствия
    if (lowerQuestion.includes('привет') || lowerQuestion.includes('здравств') || lowerQuestion.includes('добр') || lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
        return `Привет! 👋 Рад вас видеть! ${lowerQuestion.includes('день') || lowerQuestion.includes('утро') || lowerQuestion.includes('вечер') ? 'Прекрасный день для общения!' : 'Чем могу помочь?'}`;
    }
    
    // Вопросы о погоде
    if (lowerQuestion.includes('погод') || lowerQuestion.includes('weather')) {
        const cities = ['уфе', 'москв', 'санкт-петербург', 'казан', 'екатеринбург'];
        const foundCity = cities.find(city => lowerQuestion.includes(city));
        const city = foundCity ? 
            (foundCity === 'уфе' ? 'Уфе' : 
             foundCity === 'москв' ? 'Москве' :
             foundCity === 'санкт-петербург' ? 'Санкт-Петербурге' :
             foundCity === 'казан' ? 'Казани' : 'Екатеринбурге') : 'вашем городе';
        
        const weatherOptions = [
            `Сегодня в ${city} прекрасная погода! ☀️ Температура около +20°C, легкий ветерок. Идеально для прогулок!`,
            `В ${city} сегодня переменная облачность ⛅. Температура +15...+18°C. Не забудьте взять зонт на всякий случай!`,
            `Погода в ${city}: прохладный день, +10...+12°C, возможны осадки. ☔ Советую одеться потеплее!`,
            `В ${city} сегодня солнечно и ясно! 🌞 Температура +22...+25°C. Отличный день для outdoor-активностей!`
        ];
        
        return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    }
    
    // Вопросы о времени
    if (lowerQuestion.includes('врем') || lowerQuestion.includes('time') || lowerQuestion.includes('час')) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `Сейчас ${timeString}. ⏰ Время не ждет - давайте обсудим ваш вопрос!`;
    }
    
    // Общие вопросы
    const generalAnswers = [
        `Отличный вопрос! По теме "${question}" я могу сказать, что это очень интересное направление для изучения. В реальных условиях DeepSeek AI предоставит более детальный и точный ответ с учетом всех нюансов.`,
        
        `Спасибо за ваш вопрос! "${question}" - это важная тема. Если бы у меня был доступ к актуальным данным через DeepSeek API, я бы смог дать вам более конкретный и полезный ответ.`,
        
        `Интересный запрос! По вопросу "${question}" существует множество подходов и мнений. К сожалению, без доступа к полноценному AI я могу дать только общую информацию.`,
        
        `Я проанализировал ваш вопрос о "${question}". Это действительно стоящая тема для обсуждения! В рабочем режиме с DeepSeek API я бы предоставил развернутый ответ с примерами и рекомендациями.`,
        
        `По вопросу "${question}" у меня есть несколько мыслей, но для наиболее точного ответа потребуется доступ к обученной модели AI. В демо-режиме я ограничен в возможностях анализа.`
    ];
    
    return generalAnswers[Math.floor(Math.random() * generalAnswers.length)];
}
