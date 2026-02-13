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
                max_tokens: 2000,
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
    },

    /**
     * AI 批量查询单词的词性和词义
     * @param {Array} words - 纯英文单词列表 ["abandon", "ability", ...]
     * @param {Function} onProgress - 可选进度回调 (completed, total) => void
     * @returns {Array} [{word, part_of_speech, meaning}, ...]
     */
    async batchLookupWords(words, onProgress) {
        // 每批50词，同时并发3个批次
        const batchSize = 50;
        const concurrency = 3;
        const allResults = [];
        let completed = 0;

        // 将所有批次准备好
        const batches = [];
        for (let i = 0; i < words.length; i += batchSize) {
            batches.push(words.slice(i, i + batchSize));
        }

        // 处理单个批次的函数
        const processBatch = async (batch) => {
            const wordList = batch.join('\n');
            const messages = [
                {
                    role: 'system',
                    content: `你是一个英语词典助手。用户会给你一批英语单词，请为每个单词返回其最常见的一个词性和中文释义。

请严格以 JSON 数组格式返回，不要包含任何其他文字：
[
  {"word": "abandon", "part_of_speech": "v.", "meaning": "放弃"},
  ...
]

规则：
- 每个单词只给出最常见/最核心的一个词性
- 词性格式：n. v. adj. adv. prep. conj. pron. det. interj. 等
- 中文释义给最常用的两个意思，用分号分隔，总计不超过8个字
- 不要遗漏任何单词`
                },
                {
                    role: 'user',
                    content: `请为以下 ${batch.length} 个单词查询词性和释义：\n\n${wordList}`
                }
            ];

            const response = await this.chat(messages);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('AI 返回格式错误，无法解析词义结果');
            return JSON.parse(jsonMatch[0]);
        };

        // 并发执行批次
        for (let i = 0; i < batches.length; i += concurrency) {
            const group = batches.slice(i, i + concurrency);
            const results = await Promise.all(group.map(batch => processBatch(batch)));
            for (const batchResults of results) {
                allResults.push(...batchResults);
            }
            completed += group.reduce((sum, b) => sum + b.length, 0);
            if (onProgress) onProgress(Math.min(completed, words.length), words.length);
        }

        return allResults;
    },

    /**
     * AI 语义分组 + 房间命名
     * @param {Array} words - [{word, part_of_speech, meaning}, ...]
     * @returns {Array} [{roomName: "动力机房", words: [{word, part_of_speech, meaning}, ...]}, ...]
     */
    async groupWordsBySemantic(words) {
        const wordList = words.map(w => `${w.word} (${w.part_of_speech || '?'}) - ${w.meaning}`).join('\n');
        const messages = [
            {
                role: 'system',
                content: `你是一位记忆宫殿大师。用户会给你一批英语单词（含词性和中文释义），请你：

1. 按语义相似度或逻辑联系将它们分组，每组 8-12 个词
2. 为每组起一个充满画面感的房间名字（例如：动力机房、魔法厨房、失重走廊、星空图书馆、熔岩锻造间等）

请严格以 JSON 格式返回，不要包含任何其他文字：
[
  {
    "roomName": "房间名",
    "words": [
      {"word": "xxx", "part_of_speech": "v.", "meaning": "xxx"},
      ...
    ]
  },
  ...
]

注意：
- 每个单词只能出现在一个组中，不能遗漏任何单词
- 房间名要有强烈的画面感和想象力
- 分组要有逻辑性，同组的词在语义或使用场景上有关联`
            },
            {
                role: 'user',
                content: `请对以下 ${words.length} 个单词进行分组和命名：\n\n${wordList}`
            }
        ];

        const response = await this.chat(messages);
        // 提取 JSON
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('AI 返回格式错误，无法解析分组结果');
        return JSON.parse(jsonMatch[0]);
    },

    /**
     * 为单个房间生成线性逻辑故事
     * @param {string} roomName - 房间名
     * @param {Array} words - [{word, part_of_speech, meaning}, ...]
     * @returns {string} 故事内容（Markdown 格式，单词用 **word** 加粗）
     */
    async generateRoomStory(roomName, words) {
        const wordList = words.map(w => `${w.word} (${w.part_of_speech || '?'}) - ${w.meaning}`).join('\n');
        const messages = [
            {
                role: 'system',
                content: `你是一位记忆宫殿故事编写大师。请根据房间名和单词列表，编写一个极简的空间叙事故事。

格式要求（严格按照以下 Markdown 分段）：
**推门进去：** 一句有画面感的场景描写（不超过15个字），为后续故事塑造背景氛围（例如："这里的空气凝固得像水晶"、"迎面扑来热气腾腾的奶香味"）。这句话不需要包含单词，但要与后续故事的整体风格相呼应。
- **左边：** 用1-2句话串联这里的单词。
- **中间：** 同上。
- **右边：** 同上。

如果单词超过6个，可增加空间区域（如"头顶"、"脚下"、"角落"等），但每个区域不超过2句话。

单词融入规则（最重要）：
- 单词必须用 **word**（中文释义）格式标记
- 动词：让角色"执行"这个动作，如"幽灵正在 **abandon**（放弃）手中的火炬"
- 名词：让它成为场景中的"物体"，如"桌上放着一瓶 **clarity**（明晰）药水"
- 形容词：让它"修饰"场景中的事物，如"一个 **reasonable**（通情达理的）稻草人"
- 副词：让它描述动作的方式，如"钟表 **consequently**（因此）开始倒转"
- 每个单词的含义必须和它在故事中的角色一致，不能脱节

风格要求：
- 情节越怪异越好（超现实、荒诞、古怪）
- 逻辑不要求正确，但叙事流畅
- 全文控制在 100-200 字之间，极简精炼
- 用中文编写`
            },
            {
                role: 'user',
                content: `房间名：${roomName}\n\n单词列表：\n${wordList}\n\n请编写故事。`
            }
        ];

        return this.chat(messages);
    }
};
