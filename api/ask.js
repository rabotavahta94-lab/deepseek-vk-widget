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
        
        if (question.length > 1000) {
            return res.status(400).json({
                error: 'Слишком длинный запрос',
                message: 'Максимальная длина вопроса: 1000 символов'
            });
        }
        
        console.log('Получен вопрос:', question.substring(0, 100));
        
        // Получаем API ключ из переменных окружения
        const HF_API_KEY = process.env.HUGGINGFACE_TOKEN;
        
        if (HF_API_KEY) {
            // Попробуем использовать модель для русского языка
            try {
                const hfResponse = await fetch(
                    'https://api-inference.huggingface.co/models/DeepPavlov/rubert-base-cased-conversational',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${HF_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: question,
                            parameters: {
                                max_length: 300,
                                temperature: 0.7,
                                do_sample: true,
                                return_full_text: false
                            }
                        })
                    }
                );
                
                if (hfResponse.ok) {
                    const hfData = await hfResponse.json();
                    if (hfData && hfData[0] && hfData[0].generated_text) {
                        console.log('Успешный ответ от Hugging Face');
                        return res.status(200).json({ 
                            answer: hfData[0].generated_text,
                            question: question,
                            timestamp: new Date().toISOString(),
                            provider: 'huggingface',
                            responseId: Math.random().toString(36).substring(2, 9)
                        });
                    }
                } else {
                    console.log('Hugging Face API error:', hfResponse.status);
                }
            } catch (hfError) {
                console.log('Hugging Face не доступен:', hfError.message);
            }
            
            // Альтернативная модель, если первая не сработала
            try {
                const hfResponse2 = await fetch(
                    'https://api-inference.huggingface.co/models/sberbank-ai/rugpt3large_based_on_gpt2',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${HF_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: question,
                            parameters: {
                                max_length: 200,
                                temperature: 0.7,
                                do_sample: true,
                                return_full_text: false
                            }
                        })
                    }
                );
                
                if (hfResponse2.ok) {
                    const hfData = await hfResponse2.json();
                    if (hfData && hfData[0] && hfData[0].generated_text) {
                        console.log('Успешный ответ от альтернативной модели');
                        return res.status(200).json({ 
                            answer: hfData[0].generated_text,
                            question: question,
                            timestamp: new Date().toISOString(),
                            provider: 'huggingface_rugpt',
                            responseId: Math.random().toString(36).substring(2, 9)
                        });
                    }
                }
            } catch (hfError2) {
                console.log('Альтернативная модель не доступна:', hfError2.message);
            }
        }
        
        // Умный демо-режим как запасной вариант
        const smartAnswer = generateSmartAnswer(question);
        
        return res.status(200).json({ 
            answer: smartAnswer,
            question: question,
            timestamp: new Date().toISOString(),
            provider: HF_API_KEY ? 'smart_demo_fallback' : 'smart_demo',
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

// Умный генератор ответов
function generateSmartAnswer(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Приветствия
    if (/(привет|здравств|добр|hello|hi)/i.test(question)) {
        const greetings = [
            "Привет! 👋 Рад вас видеть! Чем могу помочь?",
            "Здравствуйте! 😊 Очень рад нашему общению. Что вас интересует?",
            "Приветствую! 🌟 Задавайте ваш вопрос, я готов помочь."
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Вопросы о погоде
    if (/(погод|weather)/i.test(question)) {
        const cities = ['уфе', 'москв', 'питер', 'санкт-петербург', 'казан', 'екатеринбург'];
        const foundCity = cities.find(city => lowerQuestion.includes(city));
        const city = foundCity ? 
            (foundCity === 'уфе' ? 'Уфе' : 
             foundCity === 'москв' ? 'Москве' :
             foundCity === 'питер' || foundCity === 'санкт-петербург' ? 'Санкт-Петербурге' :
             foundCity === 'казан' ? 'Казани' : 'Екатеринбурге') : 'вашем городе';
        
        const weatherOptions = [
            `Сегодня в ${city} прекрасная погода! ☀️ Температура около +20°C, легкий ветерок.`,
            `В ${city} сегодня переменная облачность ⛅. Температура +15...+18°C.`,
            `Погода в ${city}: прохладно, +10...+12°C, возможны осадки. ☔`
        ];
        return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    }
    
    // Вопросы о времени
    if (/(врем|time|час)/i.test(question)) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `Сейчас ${timeString}. ⏰ Время не ждет - давайте обсудим ваш вопрос!`;
    }
    
    // Базовые вопросы
    if (/(как дела|как ты)/i.test(question)) {
        return 'У меня всё отлично! 😊 Готов помогать вам с вопросами. А у вас как дела?';
    }
    
    if (/(спасибо|благодар)/i.test(question)) {
        return 'Пожалуйста! 😊 Всегда рад помочь! Если есть еще вопросы - обращайтесь!';
    }
    
    if (/(пока|до свидан)/i.test(question)) {
        return 'До свидания! 👋 Буду рад помочь вам снова!';
    }
    
    // Контекстные ответы
    const contextualAnswers = [
        `Отличный вопрос! По теме "${question}" я могу сказать, что это очень интересное направление для изучения.`,
        `Спасибо за ваш запрос! "${question}" - это важная тема, которая заслуживает внимательного рассмотрения.`,
        `Я проанализировал ваш вопрос о "${question}". Это сложная тема, требующая глубокого изучения.`,
        `По вопросу "${question}" существует несколько точек зрения. Рекомендую изучить разные подходы.`,
        `Ваш вопрос "${question}" затрагивает интересную проблему. Для полного ответа важно учитывать контекст.`
    ];
    
    return contextualAnswers[Math.floor(Math.random() * contextualAnswers.length)];
}
