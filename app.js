// Инициализация VK Bridge
vkBridge.send('VKWebAppInit');

// Элементы DOM
const chat = document.getElementById('chat');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Конфигурация API
const API_CONFIG = {
    url: 'https://api.deepseek.com/v1/chat/completions',
    // ЗАМЕНИТЕ НА ВАШ РЕАЛЬНЫЙ API КЛЮЧ
    apiKey: 'sk-your-deepseek-api-key-here'
};

// Функция добавления сообщения
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = text;
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

// Функция показа загрузки
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = 'loading';
    loadingDiv.textContent = 'DeepSeek думает...';
    chat.appendChild(loadingDiv);
    chat.scrollTop = chat.scrollHeight;
}

// Функция скрытия загрузки
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
}

// Функция показа ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    chat.appendChild(errorDiv);
    chat.scrollTop = chat.scrollHeight;
}

// Функция отправки сообщения к DeepSeek API
async function sendToDeepSeek(message) {
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты полезный AI-ассистент для сообщества ВКонтакте. Отвечай на русском языке кратко и понятно. Будь дружелюбным и помогай пользователям.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('DeepSeek API error:', error);
        throw new Error('Не удалось подключиться к AI. Проверьте API ключ.');
    }
}

// Основная функция обработки сообщения
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Добавляем сообщение пользователя
    addMessage(message, true);
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    // Показываем индикатор загрузки
    showLoading();

    try {
        const response = await sendToDeepSeek(message);
        hideLoading();
        addMessage(response, false);
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error:', error);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Обработчики событий
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// Инициализация VK
vkBridge.subscribe((e) => {
    if (e.detail.type === 'VKWebAppUpdateConfig') {
        const scheme = e.detail.data.scheme;
        // Адаптация под темную тему ВК
        if (scheme === 'dark') {
            document.body.style.background = '#191919';
        }
    }
});

// Фокус на поле ввода при загрузке
document.addEventListener('DOMContentLoaded', () => {
    userInput.focus();
});

// Обработка ошибок VK Bridge
vkBridge.send('VKWebAppGetUserInfo')
    .then(user => {
        console.log('User info:', user);
    })
    .catch(error => {
        console.log('Not in VK environment:', error);
    });
