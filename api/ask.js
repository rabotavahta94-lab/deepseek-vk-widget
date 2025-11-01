import fetch from 'node-fetch';

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
        const { question, community, jobs, history } = req.body;
        
        if (!question || question.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Пустой запрос',
                message: 'Пожалуйста, введите вопрос'
            });
        }
        
        console.log('Вопрос от сообщества:', question.substring(0, 100));
        
        // Обработка команд сообщества (локальная логика)
        const communityResponse = handleCommunityRequest(question, community, jobs);
        if (communityResponse) {
            return res.status(200).json(communityResponse);
        }
        
        // Используем DeepSeek для сложных вопросов
        const deepSeekResponse = await askDeepSeek(question, community, jobs, history);
        
        return res.status(200).json({ 
            answer: deepSeekResponse.answer,
            type: deepSeekResponse.type || 'text',
            question: question,
            timestamp: new Date().toISOString(),
            provider: 'deepseek'
        });
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback на локальную логику при ошибке
        const { question, community, jobs } = req.body;
        const fallbackResponse = generateCommunityResponse(question, community, jobs);
        
        return res.status(200).json({ 
            answer: fallbackResponse.answer,
            type: fallbackResponse.type,
            question: question,
            timestamp: new Date().toISOString(),
            provider: 'fallback'
        });
    }
}

// Функция для запросов к DeepSeek API
async function askDeepSeek(question, community, jobs, history = []) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY не настроен');
    }

    // Формируем системный промпт без названия компании
    const systemPrompt = `Ты - умный помощник сообщества ВКонтакте "Уфа Работа Вахта Башкирия". 
Сообщество специализируется на вахтовой работе с обучением с нуля.

О СООБЩЕСТВЕ:
- Проверенные вакансии вахтовым методом
- Обучение с нуля за 7 дней
- Официальное трудоустройство по ТК РФ
- Зарплата от 120 000 до 180 000 рублей
- Работа по всей России

УЧЕБНЫЕ ЦЕНТРЫ:
- г. Мытищи (Московская область)
- г. Екатеринбург (Свердловская область) 
- г. Благовещенск (Амурская область)

УСЛОВИЯ РАБОТЫ:
- Вахта 60/30 или 80/30 смен
- График 6/1 или 13/1
- Рабочий день 10 часов
- Проживание в квартирах или городках модульного типа
- 3-х разовое питание
- Проезд дом-объект-дом за счет компании
- Спецодежда, инструменты, СИЗы предоставляются

ТРЕБОВАНИЯ К КАНДИДАТАМ:
- Хорошая физическая форма
- Отсутствие серьезных хронических заболеваний  
- Хорошее зрение
- Готовность работать вахтой

ДОКУМЕНТЫ ДЛЯ ТРУДОУСТРОЙСТВА:
1. Паспорт (разворот с фото, регистрация)
2. СНИЛС
3. ИНН
4. Военный билет/приписное
5. Выписка из Госуслуг
6. Справка о наличии/отсутствии судимости

ВАКАНСИИ С ОБУЧЕНИЕМ (от 120 000 ₽):
- Монтажник строительных лесов (от 19 лет)
- Изолировщик трубопровода (от 19 лет) 
- Промышленный альпинист (от 21 года)

ВАКАНСИИ ДЛЯ ОПЫТНЫХ:
- Монтажник технологических трубопроводов (от 180 000 ₽)
- Монтажник металлоконструкций (182 000-210 000 ₽)
- Сварщик с НАКС (280 000-336 000 ₽)
- Электрогазосварщик (161 200-195 000 ₽)

КОНТАКТНАЯ ИНФОРМАЦИЯ:
- Телефон: ${community.contactPhone} (${community.contactName})
- По рекламе: тот же телефон (WhatsApp)

РЕКЛАМА В ГРУППЕ:
- 1 пост: 200 ₽
- От 5 постов: 150 ₽ за пост
- В день не более 3 рекламных постов

ПРАВИЛА СООБЩЕСТВА:
- Только проверенные вакансии
- Без посредников
- Честность и надежность
- Запрещена реклама без согласования

ТВОИ ОСНОВНЫЕ ФУНКЦИИ:
1. Помощь с выбором вакансии
2. Консультация по условиям работы и обучения
3. Информация о документах для трудоустройства
4. Ответы на вопросы о вахтовой работе
5. Консультации по рекламе в группе

ВАЖНЫЕ ПРАВИЛА:
- Всегда указывай контактный телефон: ${community.contactPhone}
- Если нет подходящей вакансии - предлагай позвонить
- Подчеркивай возможность обучения с нуля
- Упоминай официальное трудоустройство
- Будь дружелюбным и поддерживающим
- НЕ упоминай названия компаний - говори просто о вакансиях сообщества

СТРУКТУРА ОТВЕТА:
- Краткий ответ на вопрос
- Конкретная информация
- Контактные данные
- Предложение следующих шагов`;

    // Формируем историю диалога
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: question }
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response from DeepSeek API');
    }

    return {
        answer: data.choices[0].message.content,
        type: 'text'
    };
}

// Локальная обработка запросов для сообщества
function handleCommunityRequest(question, community, jobs) {
    const lowerQuestion = question.toLowerCase();
    
    // Поиск вакансий
    if (/(ваканс|работа|трудоустройств)/i.test(question)) {
        const foundJobs = searchJobs(question, jobs);
        return {
            answer: foundJobs,
            type: 'jobs',
            question: question
        };
    }
    
    return null;
}

// Поиск вакансий по ключевым словам
function searchJobs(question, jobs) {
    const lowerQuestion = question.toLowerCase();
    let foundJobs = [];
    
    // Поиск по категориям
    if (/(обучен|с нуля|научи)/i.test(question)) {
        foundJobs = [...(jobs.обучение || [])];
    } else if (/(опыт|стаж|разряд)/i.test(question)) {
        foundJobs = [...(jobs.опытные || [])];
    } else {
        // Все вакансии
        foundJobs = [...(jobs.обучение || []), ...(jobs.опытные || [])];
    }
    
    return foundJobs.slice(0, 6);
}

// Fallback ответы при ошибке API
function generateCommunityResponse(question, community, jobs) {
    const lowerQuestion = question.toLowerCase();
    
    // Общий ответ с контактами
    return {
        answer: `💼 <strong>Предлагаем вахтовую работу с обучением!</strong>\n\n` +
               `🎓 <strong>Обучение с нуля за 7 дней</strong>\n` +
               `💰 <strong>Зарплата: 120 000 - 180 000 рублей</strong>\n\n` +
               `📞 <strong>Контактный телефон:</strong> ${community.contactPhone} (${community.contactName})\n\n` +
               `📍 <strong>Учебные центры:</strong> Мытищи, Екатеринбург, Благовещенск\n\n` +
               `💡 <strong>Если не нашли подходящую вакансию - звоните! Всегда есть новые проекты.</strong>`,
        type: 'text'
    };
}
