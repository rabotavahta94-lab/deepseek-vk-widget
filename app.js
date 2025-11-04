class DeepSeekVKApp {
    constructor() {
        this.init();
        this.bindEvents();
        this.chatHistory = [];
        this.isMobile = window.innerWidth <= 767;
    }

    init() {
        this.vkBridge = window.vkBridge;
        this.messagesContainer = document.getElementById('messages');
        this.welcomeMessage = document.getElementById('welcome-message');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.bottomNav = document.getElementById('bottom-nav');
        this.charCounter = document.getElementById('char-count');
        
        this.initVKBridge();
        this.loadChatHistory();
        this.setupCharacterCounter();
    }

    async initVKBridge() {
        if (this.vkBridge) {
            try {
                await this.vkBridge.send('VKWebAppInit');
                console.log('VK Bridge инициализирован');
                
                const user = await this.vkBridge.send('VKWebAppGetUserInfo');
                this.userId = user.id;
                
            } catch (error) {
                console.log('VK Bridge не доступен, работаем в standalone режиме');
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

        // Быстрые действия
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.userInput.value = prompt;
                this.autoResizeTextarea();
                this.userInput.focus();
            });
        });

        // Новый чат
        document.getElementById('new-chat').addEventListener('click', () => this.newChat());
        document.getElementById('new-chat-mobile').addEventListener('click', () => this.newChat());

        // Нижняя навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleNavAction(action);
            });
        });

        // Пункты меню
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleMenuAction(action);
            });
        });
    }

    setupCharacterCounter() {
        this.userInput.addEventListener('input', () => {
            const count = this.userInput.value.length;
            this.charCounter.textContent = count;
            
            if (count > 1800) {
                this.charCounter.style.color = '#dc3545';
            } else if (count > 1500) {
                this.charCounter.style.color = '#ffc107';
            } else {
                this.charCounter.style.color = '#666';
            }
        });
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
        this.charCounter.textContent = '0';
        this.charCounter.style.color = '#666';

        // Скрываем welcome сообщение
        this.hideWelcomeMessage();

        // Добавляем сообщение пользователя
        this.addMessage(message, 'user');

        // Показываем индикатор набора
        this.showTypingIndicator();

        // Блокируем кнопку отправки
        this.sendButton.disabled = true;

        try {
            const response = await window.deepseekAPI.sendMessage(message, this.chatHistory);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            this.saveToHistory(message, response);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Извините, произошла ошибка. Пожалуйста, проверьте подключение к интернету и попробуйте еще раз.', 'bot');
            console.error('Ошибка:', error);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    hideWelcomeMessage() {
        if (this.welcomeMessage) {
            this.welcomeMessage.style.display = 'none';
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Форматирование текста (простейшее)
        const formattedText = text.replace(/\n/g, '<br>');
        messageDiv.innerHTML = formattedText;
        
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
        const feature = e.target.closest('.feature-btn').dataset.feature;
        const presetMessages = {
            text: 'Напиши подробный текст на тему: ',
            code: 'Напиши код для: ',
            translate: 'Переведи на английский: '
        };

        this.userInput.value = presetMessages[feature];
        this.userInput.focus();
        this.autoResizeTextarea();
    }

    handleNavAction(action) {
        switch (action) {
            case 'new-chat':
                this.newChat();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'menu':
                this.toggleMobileMenu();
                break;
        }
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new-chat':
                this.newChat();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'about':
                this.showAbout();
                break;
        }
        this.toggleMobileMenu();
    }

    toggleMobileMenu() {
        this.mobileMenu.classList.toggle('active');
    }

    newChat() {
        if (this.chatHistory.length > 0) {
            if (confirm('Вы уверены, что хотите начать новый чат? Текущая история будет очищена.')) {
                this.messagesContainer.innerHTML = '';
                this.chatHistory = [];
                this.saveChatHistory();
                this.welcomeMessage.style.display = 'block';
            }
        }
    }

    showHistory() {
        alert('Функция истории чатов будет реализована в следующем обновлении!');
    }

    showSettings() {
        alert('Настройки будут доступны в следующем обновлении!');
    }

    showHelp() {
        alert('Помощь: Просто введите ваш вопрос в поле ввода и нажмите отправить. Используйте кнопки для быстрого доступа к функциям.');
    }

    showAbout() {
        alert('DeepSeek AI Assistant\nВерсия 1.0\n\nAI-помощник для сообществ ВКонтакте на базе DeepSeek AI');
    }

    saveToHistory(userMessage, botMessage) {
        this.chatHistory.push({
            user: userMessage,
            bot: botMessage,
            timestamp: new Date().toISOString()
        });
        
        // Ограничиваем историю последними 50 сообщениями
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(-50);
        }
        
        this.saveChatHistory();
    }

    saveChatHistory() {
        localStorage.setItem('deepseek_chat_history', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('deepseek_chat_history');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
            
            // Восстанавливаем последние сообщения
            const recentMessages = this.chatHistory.slice(-20);
            if (recentMessages.length > 0) {
                this.hideWelcomeMessage();
                recentMessages.forEach(chat => {
                    this.addMessage(chat.user, 'user');
                    this.addMessage(chat.bot, 'bot');
                });
            }
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.deepSeekApp = new DeepSeekVKApp();
});
