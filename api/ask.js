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
        const { question, community, jobs } = req.body;
        
        if (!question || question.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Пустой запрос',
                message: 'Пожалуйста, введите вопрос'
            });
        }
        
        console.log('Вопрос от сообщества:', question.substring(0, 100));
        
        // Обработка команд сообщества
        const communityResponse = handleCommunityRequest(question, community, jobs);
        if (communityResponse) {
            return res.status(200).json(communityResponse);
        }
        
        // Умный ответ с учетом тематики сообщества
        const smartResponse = generateCommunityResponse(question, community, jobs);
        
        return res.status(200).json({ 
            answer: smartResponse.answer,
            type: smartResponse.type,
            question: question,
            timestamp: new Date().toISOString(),
            provider: 'community_bot'
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            message: 'Пожалуйста, попробуйте еще раз позже'
        });
    }
}

// Обработка запросов для сообщества
function handleCommunityRequest(question, community, jobs) {
    const lowerQuestion = question.toLowerCase();
    
    // Поиск вакансий
    if (/(ваканс|работа|ищу работу|трудоустройств)/i.test(question)) {
        const foundJobs = searchJobs(question, jobs);
        return {
            answer: foundJobs,
            type: 'jobs',
            question: question
        };
    }
    
    // Оформление заявки
    if (/(заявк|анкет|отклик|резюме)/i.test(question)) {
        return {
            answer: getApplicationProcess(question),
            type: 'application',
            question: question
        };
    }
    
    // Вопросы о сообществе
    if (/(сообществ|групп|подписчик)/i.test(question)) {
        return {
            answer: getCommunityInfo(community),
            type: 'text',
            question: question
        };
    }
    
    return null;
}

// Поиск вакансий по ключевым словам
function searchJobs(question, jobs) {
    const lowerQuestion = question.toLowerCase();
    const foundJobs = [];
    
    // Поиск по категориям
    if (/(нефтегаз|нефт|газ)/i.test(question)) {
        foundJobs.push(...(jobs.нефтегаз || []));
    }
    
    if (/(строительств|стройк|монтаж)/i.test(question)) {
        foundJobs.push(...(jobs.строительство || []));
    }
    
    if (/(водитель|логистик|перевозк)/i.test(question)) {
        foundJobs.push(...(jobs.логистика || []));
    }
    
    // Если не нашли по категориям, показываем все
    if (foundJobs.length === 0) {
        Object.values(jobs).forEach(category => {
            foundJobs.push(...category);
        });
    }
    
    return foundJobs.slice(0, 5); // Ограничиваем 5 вакансиями
}

// Процесс оформления заявки
function getApplicationProcess(question) {
    const steps = [
        "📝 Начнем оформление заявки! Укажите:\n1. ФИО полностью\n2. Желаемую вакансию\n3. Опыт работы\n4. Контактный телефон",
        "📞 Отлично! Теперь укажите:\n5. Возраст\n6. Образование\n7. Гражданство\n8. Регион проживания",
        "✅ Почти готово! Последние данные:\n9. Наличие медкнижки\n10. Водительские права (категории)\n11. Готовность к вахте"
    ];
    
    return steps[Math.floor(Math.random() * steps.length)];
}

// Информация о сообществе
function getCommunityInfo(community) {
    return `ℹ️ Информация о сообществе "${community.name}":\n\n` +
           `👥 Подписчиков: ${community.subscribers}\n` +
           `⏱ Ответ за: ${community.responseTime}\n` +
           `📍 ${community.city}\n\n` +
           `💼 Основные направления:\n` +
           `• Вахтовая работа в Уфе и Башкирии\n` +
           `• Трудоустройство по всей России\n` +
           `• Консультации по вакансиям\n` +
           `• Поддержка соискателей`;
}

// Умные ответы для сообщества
function generateCommunityResponse(question, community, jobs) {
    const lowerQuestion = question.toLowerCase();
    
    // Приветствия
    if (/(привет|здравств|добр|hello|hi)/i.test(question)) {
        return {
            answer: `👋 Приветствую в сообществе "${community.name}"! 💼\n\nЯ помогу с поиском работы, оформлением заявок и отвечу на вопросы о вахтовой работе. Что вас интересует?`,
            type: 'text'
        };
    }
    
    // Вопросы о зарплате
    if (/(зарплат|оплат|доход|заработок)/i.test(question)) {
        return {
            answer: `💰 Уровень зарплат на вахте:\n\n` +
                   `• Рабочие специальности: 75 000 - 100 000 ₽\n` +
                   `• Водители: 80 000 - 110 000 ₽\n` +
                   `• Операторы, электромонтеры: 85 000 - 120 000 ₽\n` +
                   `• Инженеры, мастера: от 100 000 ₽\n\n` +
                   `💡 Конкретная зарплата зависит от опыта и графика работы!`,
            type: 'text'
        };
    }
    
    // График работы
    if (/(график|смен|вахт|отдых)/i.test(question)) {
        return {
            answer: `📅 Стандартные графики вахты:\n\n` +
                   `• 15/15 - 15 дней работы, 15 дней отдыха\n` +
                   `• 30/30 - 30 дней работы, 30 дней отдыха\n` +
                   `• 60/30 - 60 дней работы, 30 дней отдыха\n\n` +
                   `🕐 Рабочий день обычно 10-12 часов с перерывами`,
            type: 'text'
        };
    }
    
    // Требования
    if (/(требован|нужн|необходим|услови)/i.test(question)) {
        return {
            answer: `📋 Основные требования:\n\n` +
                   `• Возраст от 18 лет\n` +
                   `• Медкнижка (для некоторых вакансий)\n` +
                   `• Отсутствие судимости\n` +
                   `• Готовность к физическому труду\n` +
                   `• Для водителей - соответствующие категории\n\n` +
                   `✅ Большинство вакансий не требуют высшего образования!`,
            type: 'text'
        };
    }
    
    // Юмор
    if (/(юмор|шутк|прикол|смешн)/i.test(question)) {
        const jokes = [
            "Знаете, почему вахтовики такие сильные? Потому что они поднимают не только тяжести, но и настроение! 😄",
            "Вахтовик - это человек, который полмесяца зарабатывает деньги, а полмесяца вспоминает, куда их потратил! 💰",
            "Самое сложное в вахте - объяснить жене, почему в выходные нужно отдыхать, а не делать ремонт! 🛠️"
        ];
        return {
            answer: jokes[Math.floor(Math.random() * jokes.length)],
            type: 'text'
        };
    }
    
    // Монетизация и Donut
    if (/(donut|донат|подписк|премиум)/i.test(question)) {
        return {
            answer: `🌟 Поддержка сообщества через VK Donut:\n\n` +
                   `💖 Регулярная поддержка от 50 ₽/мес\n` +
                   `🎁 Эксклюзивный контент для подписчиков\n` +
                   `⚡ Приоритетный доступ к вакансиям\n` +
                   `📞 Персональные консультации\n\n` +
                   `Поддержите развитие сообщества! ❤️`,
            type: 'text'
        };
    }
    
    // Общий ответ
    return {
        answer: `💼 Чем могу помочь? Сообщество "${community.name}" специализируется на:\n\n` +
               `🔍 Поиске вакансий вахтовым методом\n` +
               `📝 Оформлении заявок и консультациях\n` +
               `🤝 Поддержке соискателей\n` +
               `😄 Создании дружеской атмосферы\n\n` +
               `Задайте вопрос о вакансиях, условиях работы или воспользуйтесь быстрыми кнопками!`,
        type: 'text'
    };
            }        
