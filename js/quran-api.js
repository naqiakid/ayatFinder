// Quran.com API Integration
class QuranAPI {
    constructor() {
        this.baseUrl = 'https://api.quran.com/api/v4';
        this.reciterId = 7;
        this.cache = new Map();
    }

    async getVersesWithAudio(chapterNumber, reciterId = this.reciterId) {
        const cacheKey = `verses_full_${chapterNumber}_${reciterId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // ⚠️ CRITICAL: NO SPACES in URL - copy this exactly
            const url = `${this.baseUrl}/verses/by_chapter/${chapterNumber}?language=en&words=true&audio_recitation=${reciterId}&translations=131&transliterations=161&per_page=500`;
            
            console.log('Fetching URL:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('First verse keys:', Object.keys(data.verses[0]));
            console.log('Has text_uthmani:', 'text_uthmani' in data.verses[0]);
            console.log('Has translations:', 'translations' in data.verses[0]);
            console.log('Has transliterations:', 'transliterations' in data.verses[0]);
            
            this.cache.set(cacheKey, data.verses);
            return data.verses;
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