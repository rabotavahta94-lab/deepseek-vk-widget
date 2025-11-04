class DeepSeekAPI {
    constructor() {
        this.apiKey = 'YOUR_DEEPSEEK_API_KEY'; // Замените на реальный ключ
        this.baseURL = 'https://api.deepseek.com/v1';
    }

    async sendMessage(message, history = []) {
        try {
            const messages = this.buildMessageHistory(history, message);
            
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    max_tokens: 2000,
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
            throw error;
        }
    }

    buildMessageHistory(history, newMessage) {
        const messages = [];
        
        // Добавляем историю сообщений
        history.forEach(chat => {
            messages.push({ role: 'user', content: chat.user });
            messages.push({ role: 'assistant', content: chat.bot });
        });
        
        // Добавляем новое сообщение
        messages.push({ role: 'user', content: newMessage });
        
        return messages;
    }
}

// Инициализация API
window.deepseekAPI = new DeepSeekAPI();
