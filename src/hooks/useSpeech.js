import { useState, useCallback, useEffect } from 'react';

export const useSpeech = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setIsSupported(true);

            const updateVoices = () => {
                setVoices(window.speechSynthesis.getVoices());
            };

            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, []);

    const speak = useCallback((text, lang = 'en-US') => {
        if (!isSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Find an English voice if possible
        const preferredVoice = voices.find(v => v.lang.includes(lang) && v.name.includes('Google')) ||
            voices.find(v => v.lang.includes(lang)) ||
            voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 0.9; // Slightly slower for better clarity
        window.speechSynthesis.speak(utterance);
    }, [isSupported, voices]);

    return { speak, isSupported };
};
