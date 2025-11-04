import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'mobile.html'));
});

// API endpoint для DeepSeek
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    ...history.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
        
    } catch (error) {
        console.error('DeepSeek API error:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('DeepSeek VK Widget is ready!');
});
