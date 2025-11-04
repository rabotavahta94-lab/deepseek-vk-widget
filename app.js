class DeepSeekVKApp {
    constructor() {
        this.init();
        this.bindEvents();
        this.chatHistory = [];
    }

    init() {
        this.vkBridge = window.vkBridge;
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.mobileMenu = document.getElementById('mobile-menu');
        
        this.initVKBridge();
        this.loadChatHistory();
    }

    async initVKBridge() {
        if (this.vkBridge) {
            try {
                await this.vkBridge.send('VKWebAppInit');
                console.log('VK Bridge инициализирован');
                
                // Получаем информацию о пользователе
                const user = await this.vkBridge.send('VKWebAppGetUserInfo');
                this.userId = user.id;
                
            } catch (error) {
                console.error('Ошибка инициализации VK Bridge:', error);
            }
        }
    }

    bindEvents() {
        // Отправка сообщения
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Автоматическое изменение высоты textarea
        this.userInput.addEventListener('input', this.autoResizeTextarea.bind(this));

        // Мобильное меню
        document.getElementById('menu-toggle').addEventListener('click', () => this.toggleMobileMenu());
        document.querySelector('.menu-close').addEventListener('click', () => this.toggleMobileMenu());

        // Кнопки функций
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFeatureClick(e));
        });

        // Новый чат
        document.getElementById('new-chat').addEventListener('click', () => this.newChat());
        document.getElementById('new-chat-mobile').addEventListener('click', () => this.newChat());
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Очищаем поле ввода
        this.userInput.value = '';
        this.autoResizeTextarea();

        // Добавляем сообщение пользователя
        this.addMessage(message, 'user');

        // Показываем индикатор набора
        this.showTypingIndicator();

        try {
            // Отправляем запрос к DeepSeek API
            const response = await window.deepseekAPI.sendMessage(message, this.chatHistory);
            
            // Убираем индикатор набора
            this.hideTypingIndicator();
            
            // Добавляем ответ бота
            this.addMessage(response, 'bot');
            
            // Сохраняем в историю
            this.saveToHistory(message, response);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.', 'bot');
            console.error('Ошибка:', error);
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = 'DeepSeek печатает<span class="typing-dots"></span>';
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    handleFeatureClick(e) {
        const feature = e.target.dataset.feature;
        const presetMessages = {
            text: 'Напиши подробный текст на тему:',
            code: 'Напиши код для:',
            translate: 'Переведи на английский:'
        };

        this.userInput.value = presetMessages[feature] + ' ';
        this.userInput.focus();
    }

    toggleMobileMenu() {
        this.mobileMenu.classList.toggle('active');
    }

    newChat() {
        this.messagesContainer.innerHTML = '';
        this.chatHistory = [];
        this.saveChatHistory();
        this.toggleMobileMenu(); // Закрываем меню на мобильных
    }

    saveToHistory(userMessage, botMessage) {
        this.chatHistory.push({
            user: userMessage,
            bot: botMessage,
            timestamp: new Date().toISOString()
        });
        this.saveChatHistory();
    }

    saveChatHistory() {
        localStorage.setItem('deepseek_chat_history', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('deepseek_chat_history');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
            
            // Восстанавливаем последние N сообщений
            const recentMessages = this.chatHistory.slice(-10);
            recentMessages.forEach(chat => {
                this.addMessage(chat.user, 'user');
                this.addMessage(chat.bot, 'bot');
            });
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.deepSeekApp = new DeepSeekVKApp();
});
