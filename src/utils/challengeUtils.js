export const generateQuestions = (words, story, types = ['listen', 'ch_to_en', 'en_to_ch', 'story_fill']) => {
    const questions = [];

    words.forEach(word => {
        // Pick a random question type from allowed types
        const type = types[Math.floor(Math.random() * types.length)];

        switch (type) {
            case 'listen':
                questions.push({
                    type: 'listen',
                    word: word.word,
                    audioText: word.word,
                    options: shuffle([
                        word.word,
                        ...getRandomOptions(words, word.word, 'word', 3)
                    ]),
                    answer: word.word
                });
                break;

            case 'ch_to_en':
                questions.push({
                    type: 'ch_to_en',
                    meaning: word.meaning,
                    answer: word.word
                });
                break;

            case 'en_to_ch':
                questions.push({
                    type: 'en_to_ch',
                    word: word.word,
                    options: shuffle([
                        word.meaning,
                        ...getRandomOptions(words, word.meaning, 'meaning', 3)
                    ]),
                    answer: word.meaning
                });
                break;

            case 'story_fill':
                // Find a context in story
                const context = getStoryContext(story, word.word);
                if (context) {
                    questions.push({
                        type: 'story_fill',
                        context: context,
                        answer: word.word
                    });
                } else {
                    // Fallback to en_to_ch if no context found
                    questions.push({
                        type: 'en_to_ch',
                        word: word.word,
                        options: shuffle([
                            word.meaning,
                            ...getRandomOptions(words, word.meaning, 'meaning', 3)
                        ]),
                        answer: word.meaning
                    });
                }
                break;
        }
    });

    return shuffle(questions);
};

const shuffle = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
};

const getRandomOptions = (words, currentVal, field, count) => {
    const others = words
        .map(w => w[field])
        .filter(val => val !== currentVal && val.trim() !== '');

    return shuffle(others).slice(0, count);
};

const getStoryContext = (story, word) => {
    if (!story || !word) return null;
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const index = story.toLowerCase().indexOf(word.toLowerCase());
    if (index === -1) return null;

    const start = Math.max(0, index - 40);
    const end = Math.min(story.length, index + word.length + 40);
    let snippet = story.substring(start, end);

    // Replace word with blank
    return snippet.replace(regex, ' _____ ');
};
