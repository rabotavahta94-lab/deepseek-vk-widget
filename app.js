class DeepSeekVKApp {
    constructor() {
        this.isVK = window.vkIntegration && window.vkIntegration.isVK;
        this.init();
        this.bindEvents();
        this.chatHistory = [];
    }

    init() {
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.vkMenu = document.getElementById('vk-menu-panel');
        this.vkMenuBtn = document.getElementById('vk-menu');
        
        this.loadChatHistory();
        this.setupCharacterCounter();
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

        // VK Menu
        this.vkMenuBtn.addEventListener('click', () => this.toggleVKMenu());
        
        // Быстрые действия
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.currentTarget.dataset.prompt;
                this.userInput.value = prompt;
                this.autoResizeTextarea();
                this.userInput.focus();
            });
        });

        // Пункты меню
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleMenuAction(action);
            });
        });

        // Закрытие меню по клику вне его
        document.addEventListener('click', (e) => {
            if (!this.vkMenu.contains(e.target) && e.target !== this.vkMenuBtn) {
                this.vkMenu.classList.remove('active');
            }
        });
    }

    setupCharacterCounter() {
        this.userInput.addEventListener('input', () => {
            const count = this.userInput.value.length;
            if (count > 1800) {
                this.userInput.style.borderColor = '#e52525';
            } else if (count > 1500) {
                this.userInput.style.borderColor = '#ff9d00';
            } else {
                this.userInput.style.borderColor = '#e7e8ec';
            }
        });
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 100) + 'px';
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Очищаем поле ввода
        this.userInput.value = '';
        this.autoResizeTextarea();
        this.userInput.style.borderColor = '#e7e8ec';

        // Убираем welcome сообщение при первом сообщении
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

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
            this.addMessage('Извините, произошла ошибка при обращении к AI. Пожалуйста, попробуйте еще раз.', 'bot');
            console.error('Error:', error);
        } finally {
            this.sendButton.disabled = false;
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

    toggleVKMenu() {
        this.vkMenu.classList.toggle('active');
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new-chat':
                this.newChat();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'share':
                this.shareApp();
                break;
            case 'about':
                this.showAbout();
                break;
        }
        this.toggleVKMenu();
    }

    newChat() {
        if (this.chatHistory.length > 0) {
            this.messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-avatar">🤖</div>
                    <div class="welcome-text">
                        <h3>Привет! Я DeepSeek AI</h3>
                        <p>Задавайте вопросы, и я постараюсь помочь вам наилучшим образом.</p>
                    </div>
                </div>
            `;
            this.chatHistory = [];
            this.saveChatHistory();
        }
    }

    showHistory() {
        if (this.chatHistory.length === 0) {
            alert('История чатов пуста');
        } else {
            alert(`У вас ${this.chatHistory.length} сообщений в истории`);
        }
    }

    shareApp() {
        if (window.vkIntegration) {
            window.vkIntegration.shareApp();
        } else {
            alert('Поделитесь ссылкой на приложение с друзьями!');
        }
    }

    showAbout() {
        alert('DeepSeek AI Assistant\nВерсия 1.0\n\nAI-помощник для ВКонтакте на базе DeepSeek AI');
    }

    saveToHistory(userMessage, botMessage) {
        this.chatHistory.push({
            user: userMessage,
            bot: botMessage,
            timestamp: new Date().toISOString()
        });
        
        // Ограничиваем историю
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(-50);
        }
        
        this.saveChatHistory();
    }

    saveChatHistory() {
        localStorage.setItem('deepseek_vk_chat_history', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('deepseek_vk_chat_history');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
            
            // Восстанавливаем последние сообщения
            const recentMessages = this.chatHistory.slice(-10);
            if (recentMessages.length > 0) {
                document.querySelector('.welcome-message').style.display = 'none';
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
