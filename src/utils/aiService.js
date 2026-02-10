/**
 * AI Service — 统一封装本地 Ollama 和远程 OpenAI 兼容 API
 */

const STORAGE_KEY = 'ai_config';

const defaultConfig = {
    mode: 'remote',           // 'local' | 'remote'
    localModel: 'qwen3-4b',
    remoteUrl: 'https://api.openai.com/v1/chat/completions',
    remoteKey: '',
    remoteModel: 'gpt-4o-mini',
};

export const aiService = {
    getConfig() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...defaultConfig, ...JSON.parse(saved) } : { ...defaultConfig };
        } catch {
            return { ...defaultConfig };
        }
    },

    saveConfig(config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    },

    isConfigured() {
        const cfg = this.getConfig();
        if (cfg.mode === 'local') return true;
        return !!(cfg.remoteUrl && cfg.remoteKey && cfg.remoteModel);
    },

    async checkOllamaAvailable() {
        try {
            const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
            return res.ok;
        } catch {
            return false;
        }
    },

    async chat(messages) {
        const cfg = this.getConfig();

        if (cfg.mode === 'local') {
            return this._chatOllama(messages, cfg);
        } else {
            return this._chatRemote(messages, cfg);
        }
    },

    async _chatOllama(messages, cfg) {
        const res = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: cfg.localModel,
                messages,
                stream: false,
            }),
        });
        if (!res.ok) throw new Error(`Ollama 请求失败: ${res.status}`);
        const data = await res.json();
        return data.message?.content || '';
    },

    async _chatRemote(messages, cfg) {
        const res = await fetch(cfg.remoteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cfg.remoteKey}`,
            },
            body: JSON.stringify({
                model: cfg.remoteModel,
                messages,
                temperature: 0.7,
                max_tokens: 500,
            }),
        });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new Error(`API 请求失败 (${res.status}): ${err}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    },

    async reviewSentence(word, meaning, partOfSpeech, sentence) {
        const posInfo = partOfSpeech ? ` (${partOfSpeech})` : '';
        const messages = [
            {
                role: 'system',
                content: `你是一个专业的英语教师。用户正在学习英语单词并造句练习。请对用户的英文句子进行简短点评，包含以下三个方面：
1. **拼写检查**：检查句子中的拼写错误
2. **语法纠错**：指出语法问题并给出修正
3. **地道表达**：如果句子表达不够自然，给出更地道的表达建议

请用中文回复，格式简洁。如果句子完全正确且地道，直接表扬即可。回复控制在100字以内。`
            },
            {
                role: 'user',
                content: `单词：${word}${posInfo}\n释义：${meaning}\n\n我的造句：${sentence}`
            }
        ];

        return this.chat(messages);
    }
};
