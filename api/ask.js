<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepSeek VK Widget</title>
    <style>
        :root {
            --vk-blue: #4A76A8;
            --vk-light-blue: #5B88BD;
            --vk-gray: #EDEEF0;
            --vk-dark-gray: #626D7A;
            --vk-white: #FFFFFF;
            --vk-shadow: rgba(0, 0, 0, 0.1);
            --user-msg-bg: #EBF0F7;
            --bot-msg-bg: #F5F5F5;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        body {
            background-color: var(--vk-gray);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .chat-container {
            width: 100%;
            max-width: 400px;
            height: 600px;
            background-color: var(--vk-white);
            border-radius: 12px;
            box-shadow: 0 4px 20px var(--vk-shadow);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            background-color: var(--vk-blue);
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .chat-header img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }

        .chat-header h2 {
            font-size: 18px;
            font-weight: 500;
        }

        .chat-status {
            font-size: 12px;
            opacity: 0.8;
        }

        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .message {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 12px;
            position: relative;
            animation: fadeIn 0.3s ease;
            line-height: 1.4;
        }

        .user-message {
            align-self: flex-end;
            background-color: var(--user-msg-bg);
            border-bottom-right-radius: 4px;
        }

        .bot-message {
            align-self: flex-start;
            background-color: var(--bot-msg-bg);
            border-bottom-left-radius: 4px;
        }

        .message-time {
            font-size: 11px;
            opacity: 0.6;
            margin-top: 4px;
            text-align: right;
        }

        .chat-input-container {
            padding: 16px;
            border-top: 1px solid var(--vk-gray);
            display: flex;
            gap: 10px;
        }

        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid var(--vk-gray);
            border-radius: 20px;
            outline: none;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        .chat-input:focus {
            border-color: var(--vk-light-blue);
        }

        .send-button {
            background-color: var(--vk-blue);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .send-button:hover {
            background-color: var(--vk-light-blue);
        }

        .send-button:disabled {
            background-color: var(--vk-dark-gray);
            cursor: not-allowed;
        }

        .typing-indicator {
            display: flex;
            align-self: flex-start;
            background-color: var(--bot-msg-bg);
            padding: 10px 14px;
            border-radius: 12px;
            border-bottom-left-radius: 4px;
            margin-bottom: 5px;
        }

        .typing-dots {
            display: flex;
            gap: 4px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--vk-dark-gray);
            animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
        }

        @media (max-width: 480px) {
            .chat-container {
                height: 100vh;
                max-width: 100%;
                border-radius: 0;
            }
            
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0QTc2QTgiLz4KPHBhdGggZD0iTTE1LjUgMTZIMjQuNVYyNEgyMS41VjI4SDE4LjVWMjRIMTUuNVYxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=" alt="DeepSeek Logo">
            <div>
                <h2>DeepSeek AI</h2>
                <div class="chat-status">онлайн</div>
            </div>
        </div>
        
        <div class="chat-messages" id="chatMessages">
            <div class="message bot-message">
                Привет! Я DeepSeek AI. Чем могу помочь?
                <div class="message-time">только что</div>
            </div>
        </div>
        
        <div class="chat-input-container">
            <input type="text" class="chat-input" id="messageInput" placeholder="Введите сообщение...">
            <button class="send-button" id="sendButton">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
                </svg>
            </button>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const chatMessages = document.getElementById('chatMessages');
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            
            // Функция для добавления сообщения в чат
            function addMessage(text, isUser) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
                
                const time = new Date();
                const timeString = time.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                messageDiv.innerHTML = `
                    ${text}
                    <div class="message-time">${timeString}</div>
                `;
                
                chatMessages.appendChild(messageDiv);
                
                // Прокрутка к последнему сообщению
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                return messageDiv;
            }
            
            // Функция для показа индикатора набора текста
            function showTypingIndicator() {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'typing-indicator';
                typingDiv.id = 'typingIndicator';
                typingDiv.innerHTML = `
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                `;
                
                chatMessages.appendChild(typingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                return typingDiv;
            }
            
            // Функция для удаления индикатора набора текста
            function removeTypingIndicator() {
                const indicator = document.getElementById('typingIndicator');
                if (indicator) {
                    indicator.remove();
                }
            }
            
            // Функция для отправки сообщения
            async function sendMessage() {
                const message = messageInput.value.trim();
                
                if (!message) return;
                
                // Очищаем поле ввода
                messageInput.value = '';
                
                // Добавляем сообщение пользователя
                addMessage(message, true);
                
                // Показываем индикатор набора текста
                showTypingIndicator();
                
                // Отключаем кнопку отправки
                sendButton.disabled = true;
                
                try {
                    // Имитация задержки сети и обработки запроса
                    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                    
                    // Удаляем индикатор набора текста
                    removeTypingIndicator();
                    
                    // Генерируем ответ (в реальном приложении здесь будет запрос к API)
                    const responses = [
                        "Интересный вопрос! Давайте разберемся вместе.",
                        "На основе предоставленной информации могу сказать, что...",
                        "Это зависит от многих факторов. Рассмотрим основные из них.",
                        "Вот что я могу сказать по этому поводу:",
                        "Отличный вопрос! Давайте изучим его подробнее."
                    ];
                    
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    const fullResponse = `${randomResponse} В реальном приложении здесь будет ответ от DeepSeek API.`;
                    
                    // Добавляем ответ бота
                    addMessage(fullResponse, false);
                    
                } catch (error) {
                    removeTypingIndicator();
                    addMessage("Извините, произошла ошибка при обработке запроса.", false);
                    console.error("Ошибка:", error);
                } finally {
                    // Включаем кнопку отправки
                    sendButton.disabled = false;
                    messageInput.focus();
                }
            }
            
            // Обработчики событий
            sendButton.addEventListener('click', sendMessage);
            
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            // Фокус на поле ввода при загрузке
            messageInput.focus();
        });
    </script>
</body>
</html>
