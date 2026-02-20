// Quran.com API Integration
class QuranAPI {
    constructor() {
        this.baseUrl = 'https://api.quran.com/api/v4';
        this.reciterId = 7;
        this.cache = new Map();
    }

    // ⭐ FIXED: Extract text from words array ⭐
    extractVerseText(verseData) {
        // Combine all words to get full Arabic text
        const arabic = verseData.words
            .filter(w => w.char_type_name === 'word')
            .map(w => w.text)
            .join(' ');

        // Combine all word translations
        const translation = verseData.words
            .filter(w => w.char_type_name === 'word' && w.translation?.text)
            .map(w => w.translation.text)
            .join(' ');

        // Combine all word transliterations
        const transliteration = verseData.words
            .filter(w => w.char_type_name === 'word' && w.transliteration?.text)
            .map(w => w.transliteration.text)
            .join(' ');

        return { arabic, translation, transliteration };
    }

    async getVersesWithAudio(chapterNumber, reciterId = this.reciterId) {
        const cacheKey = `verses_full_${chapterNumber}_${reciterId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const url = `${this.baseUrl}/verses/by_chapter/${chapterNumber}?language=en&words=true&audio_recitation=${reciterId}&translations=131&transliterations=161&per_page=500`;
            
            console.log('Fetching URL:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            // Process each verse to extract text
            const verses = data.verses.map(verse => {
                const textData = this.extractVerseText(verse);
                return {
                    ...verse,
                    text_uthmani: textData.arabic,
                    translations: [{ text: textData.translation }],
                    transliterations: [{ text: textData.transliteration }]
                };
            });
            
            console.log('First verse processed:', verses[0]);
            console.log('Has text_uthmani:', !!verses[0].text_uthmani);
            console.log('Has translation:', !!verses[0].translations?.[0]?.text);
            console.log('Has transliteration:', !!verses[0].transliterations?.[0]?.text);
            
            this.cache.set(cacheKey, verses);
            return verses;
        } catch (error) {
            console.error('Error fetching verses:', error);
            throw error;
        }
    }

    async downloadAudioForFingerprint(chapterNumber, verseNumber) {
        const paddedChapter = chapterNumber.toString().padStart(3, '0');
        const paddedVerse = verseNumber.toString().padStart(3, '0');
        const audioUrl = `https://verses.quran.com/Alafasy/mp3/${paddedChapter}${paddedVerse}.mp3`;
        
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        return {
            audioBuffer,
            duration: audioBuffer.duration,
            url: audioUrl
        };
    }

    async generateFingerprint(chapterNumber, verseNumber, audioProcessor) {
        const { audioBuffer, duration, url } = await this.downloadAudioForFingerprint(
            chapterNumber,
            verseNumber
        );

        const features = await audioProcessor.extractAllFeatures(audioBuffer);

        return {
            chapter: chapterNumber,
            verse: verseNumber,
            duration: parseFloat(duration.toFixed(2)),
            fingerprint: {
                duration: parseFloat(duration.toFixed(2)),
                energy: parseFloat(features.energy.toFixed(4)),
                zcr: parseFloat(features.zcr.toFixed(4)),
                centroid: Math.round(features.centroid),
                dominantFreqs: features.dominantFreqs
            },
            audioUrl: url,
            generatedAt: new Date().toISOString()
        };
    }

    clearCache() {
        this.cache.clear();
    }
}

const quranAPI = new QuranAPI();