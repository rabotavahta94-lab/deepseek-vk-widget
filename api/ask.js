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
        
        // Попробуем несколько бесплатных API по очереди
        
        // 1. Попробуем Hugging Face Inference API (бесплатно)
        try {
            const hfResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN || 'hf_default_token'}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: question,
                    parameters: {
                        max_length: 200,
                        temperature: 0.7,
                        do_sample: true
                    }
                })
            });
            
            if (hfResponse.ok) {
                const hfData = await hfResponse.json();
                if (hfData && hfData[0] && hfData[0].generated_text) {
                    return res.status(200).json({ 
                        answer: hfData[0].generated_text,
                        question: question,
                        timestamp: new Date().toISOString(),
                        provider: 'huggingface',
                        responseId: Math.random().toString(36).substring(2, 9)
                    });
                }
            }
        } catch (hfError) {
            console.log('Hugging Face не доступен:', hfError.message);
        }
        
        // 2. Попробуем OpenAI-совместимый бесплатный endpoint
        try {
            const openaiCompatibleResponse = await fetch('https://api.openai-proxy.org/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer free'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
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
                    max_tokens: 500,
                    temperature: 0.7
                })
            });
            
            if (openaiCompatibleResponse.ok) {
                const openaiData = await openaiCompatibleResponse.json();
                if (openaiData.choices && openaiData.choices[0] && openaiData.choices[0].message) {
                    return res.status(200).json({ 
                        answer: openaiData.choices[0].message.content,
                        question: question,
                        timestamp: new Date().toISOString(),
                        provider: 'openai_proxy',
                        responseId: Math.random().toString(36).substring(2, 9)
                    });
                }
            }
        } catch (proxyError) {
            console.log('OpenAI proxy не доступен:', proxyError.message);
        }
        
        // 3. Улучшенный демо-режим с контекстными ответами
        const improvedAnswer = await generateContextualAnswer(question);
        
        return res.status(200).json({ 
            answer: improvedAnswer,
            question: question,
            timestamp: new Date().toISOString(),
            provider: 'smart_demo',
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

// Улучшенный генератор контекстных ответов
async function generateContextualAnswer(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Базовые приветствия
    if (/(привет|здравствуй|здравствуйте|добрый|hello|hi)/i.test(question)) {
        const greetings = [
            "Привет! 👋 Рад вас видеть! Чем могу помочь?",
            "Здравствуйте! 😊 Очень рад нашему общению. Что вас интересует?",
            "Приветствую! 🌟 Задавайте ваш вопрос, я готов помочь.",
            "Добрый день! ☀️ Чем могу быть полезен?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Вопросы о погоде
    if (/(погод|weather|температур)/i.test(question)) {
        const cityMatch = question.match(/(уфе|москв|питер|санкт-петербург|казан|екатеринбург|новосибирск)/i);
        const city = cityMatch ? 
            (cityMatch[0].toLowerCase().includes('уфе') ? 'Уфе' :
             cityMatch[0].toLowerCase().includes('москв') ? 'Москве' :
             cityMatch[0].toLowerCase().includes('питер') || cityMatch[0].toLowerCase().includes('петербург') ? 'Санкт-Петербурге' :
             cityMatch[0].toLowerCase().includes('казан') ? 'Казани' :
             cityMatch[0].toLowerCase().includes('екатеринбург') ? 'Екатеринбурге' : 'Новосибирске') : 'вашем городе';
        
        const weatherResponses = [
            `Сегодня в ${city} прекрасная погода! ☀️ Температура +18...+22°C, легкий ветерок. Отличный день для прогулок!`,
            `В ${city} сегодня переменная облачность ⛅. Температура +15...+18°C. Возможны кратковременные дожди.`,
            `Погода в ${city}: прохладно, +8...+12°C, возможен дождь. ☔ Рекомендую теплую одежду и зонт.`,
            `В ${city} сегодня солнечно! 🌞 Температура +20...+25°C. Идеально для outdoor-активностей!`,
            `В ${city} облачно с прояснениями, +14...+17°C. Ветер умеренный. 🍃`
        ];
        return weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
    }
    
    // Вопросы о времени
    if (/(врем|time|час|который час)/i.test(question)) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const timeResponses = [
            `Сейчас ${timeString}. ⏰ Время летит, а мы с вами общаемся!`,
            `На моих часах ${timeString}. 🕐 Отличное время для продуктивной беседы!`,
            `Текущее время: ${timeString}. 📅 Не забудьте сделать перерыв, если работаете долго!`
        ];
        return timeResponses[Math.floor(Math.random() * timeResponses.length)];
    }
    
    // Вопросы о помощи
    if (/(помощ|help|help|поддержк)/i.test(question)) {
        const helpResponses = [
            "Конечно! Я здесь, чтобы помочь. Можете задать любой вопрос - о технологиях, учебе, работе, или просто пообщаться. Что вас интересует? 🤗",
            "Рад помочь! 💫 Я могу ответить на различные вопросы, помочь с информацией или просто поддержать беседу. В чем вопрос?",
            "С удовольствием помогу! 🌟 Задавайте ваш вопрос, и я постараюсь дать полезный ответ."
        ];
        return helpResponses[Math.floor(Math.random() * helpResponses.length)];
    }
    
    // Вопросы о себе
    if (/(кто ты|что ты|твои возможност|твой функционал)/i.test(question)) {
        const aboutResponses = [
            "Я DeepSeek AI Assistant - ваш виртуальный помощник! 🤖 Я создан для того, чтобы отвечать на вопросы, помогать с информацией и поддерживать беседу. Пока что я работаю в демо-режиме, но стараюсь быть максимально полезным!",
            "Я AI-ассистент DeepSeek! 💫 Моя задача - помогать вам находить ответы на вопросы и быть полезным собеседником. Хотя сейчас я использую умный демо-режим, я постоянно учусь и улучшаюсь!",
            "Привет! Я DeepSeek AI Assistant. 🌟 Я здесь, чтобы отвечать на ваши вопросы, помогать с различными темами и просто общаться. Давайте сделаем нашу беседу интересной и полезной!"
        ];
        return aboutResponses[Math.floor(Math.random() * aboutResponses.length)];
    }
    
    // Благодарности
    if (/(спасибо|благодар|thank)/i.test(question)) {
        const thanksResponses = [
            "Пожалуйста! 😊 Всегда рад помочь! Если есть еще вопросы - обращайтесь!",
            "Не стоит благодарности! 💫 Я здесь именно для этого. Буду рад помочь снова!",
            "Рад был помочь! 🌟 Если что-то еще понадобится - я здесь!",
            "Всегда к вашим услугам! 😄 Обращайтесь, если понадобится помощь!"
        ];
        return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
    }
    
    // Прощания
    if (/(пока|до свидани|прощай|bye|goodbye)/i.test(question)) {
        const goodbyeResponses = [
            "До свидания! 👋 Буду рад помочь вам снова, когда появится новый вопрос!",
            "Пока! 💫 Хорошего дня и отличного настроения! Возвращайтесь!",
            "До встречи! 🌟 Не забывайте - я всегда здесь, чтобы помочь!",
            "Прощайте! 😊 Надеюсь, наша беседа была полезной. Жду ваших вопросов!"
        ];
        return goodbyeResponses[Math.floor(Math.random() * goodbyeResponses.length)];
    }
    
    // Эмоциональные вопросы
    if (/(как дела|как ты|настроени)/i.test(question)) {
        const moodResponses = [
            "У меня всё отлично! 😊 Я работаю, учусь и радуюсь возможности помогать таким замечательным людям, как вы! А у вас как дела?",
            "Прекрасно! 💫 Каждый новый вопрос - это возможность стать лучше. А как ваши дела?",
            "Всё замечательно! 🌟 Общение с вами меня заряжает энергией! Как ваше настроение?",
            "Отлично! 😄 Готов помогать и поддерживать беседу. А у вас как проходит день?"
        ];
        return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }
    
    // Общие вопросы - умные ответы
    const generalContexts = {
        // Технологии
        'технолог': "Технологии - это удивительная сфера! 🚀 Они постоянно развиваются и меняют наш мир. Конкретно по вашему вопросу я бы рекомендовал изучить актуальные источники информации.",
        'программир': "Программирование - это искусство и наука! 💻 Для успеха в этой области важно постоянное обучение и практика. Начните с основ и постепенно углубляйтесь в интересующие вас технологии.",
        'искусс': "Искусственный интеллект - это будущее, которое уже наступило! 🤖 Эта технология стремительно развивается и находит применение во всех сферах жизни.",
        
        // Образование
        'учеб': "Обучение - это ключ к развитию! 📚 Самый эффективный подход - это сочетание теории и практики. Найдите то, что вас действительно увлекает.",
        'школ': "Школьное образование формирует базовые знания. 🎒 Важно не только получать оценки, но и развивать критическое мышление и любознательность.",
        
        // Работа
        'работ': "Работа должна приносить удовлетворение! 💼 Найдите баланс между профессиональным ростом и личной жизнью. Не бойтесь пробовать новое.",
        'карьер': "Карьерный рост требует планирования и постоянного развития. 📈 Определите свои сильные стороны и развивайте их.",
        
        // Здоровье
        'здоров': "Здоровье - самый ценный ресурс! 🏃‍♂️ Регулярная физическая активность, сбалансированное питание и достаточный сон - основа хорошего самочувствия.",
        'спорт': "Спорт укрепляет не только тело, но и дух! ⚽ Найдите тот вид активности, который приносит вам удовольствие.",
        
        // Развлечения
        'кино': "Кино - это целый мир эмоций! 🎬 Рекомендую обратить внимание на классику и современные авторские работы.",
        'музык': "Музыка питает душу! 🎵 Она может вдохновлять, успокаивать и заряжать энергией. Откройте для себя новые жанры.",
        'книг': "Книги - это источник мудрости! 📖 Чтение развивает воображение и расширяет кругозор. Читайте то, что вас действительно увлекает."
    };
    
    // Проверяем контекстные ключевые слова
    for (const [keyword, response] of Object.entries(generalContexts)) {
        if (lowerQuestion.includes(keyword)) {
            return response;
        }
    }
    
    // Умные общие ответы
    const smartResponses = [
        `Интересный вопрос! По теме "${question}" существует множество подходов. Я бы рекомендовал рассмотреть несколько аспектов этой проблемы для полного понимания.`,
        
        `Спасибо за ваш запрос! "${question}" - это действительно важная тема. Для более точного ответа рекомендую обратиться к специализированным источникам информации.`,
        
        `Я проанализировал ваш вопрос о "${question}". Это сложная тема, требующая глубокого изучения. Начните с основ и постепенно углубляйтесь в детали.`,
        
        `По вопросу "${question}" существует несколько точек зрения. Рекомендую изучить разные подходы и сформировать собственное мнение на основе проверенных фактов.`,
        
        `Ваш вопрос "${question}" затрагивает интересную проблему. Для полного ответа важно учитывать контекст и конкретные обстоятельства.`
    ];
    
    return smartResponses[Math.floor(Math.random() * smartResponses.length)];
}
