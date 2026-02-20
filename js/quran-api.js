// Quran.com API Integration
// Documentation: https://quran.com/api/v4

class QuranAPI {
    constructor() {
        this.baseUrl = 'https://api.quran.com/api/v4';
        this.reciterId = 7; // Mishary Rashid Alafasy
        this.cache = new Map();
    }

    // Get all chapters (surahs)
    async getChapters() {
        const cacheKey = 'chapters';
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${this.baseUrl}/chapters?language=en`);
            const data = await response.json();
            this.cache.set(cacheKey, data.chapters);
            return data.chapters;
        } catch (error) {
            console.error('Error fetching chapters:', error);
            throw error;
        }
    }

    // Get specific chapter info
    async getChapter(chapterNumber) {
        try {
            const response = await fetch(`${this.baseUrl}/chapters/${chapterNumber}?language=en`);
            const data = await response.json();
            return data.chapter;
        } catch (error) {
            console.error('Error fetching chapter:', error);
            throw error;
        }
    }

    // Get single verse with audio
    async getVerse(chapterNumber, verseNumber, reciterId = this.reciterId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/verses/by_key/${chapterNumber}:${verseNumber}?language=en&audio_recitation=${reciterId}`
            );
            const data = await response.json();
            return data.verse;
        } catch (error) {
            console.error('Error fetching verse:', error);
            throw error;
        }
    }

    // Get audio URL for a verse
    getAudioUrl(chapterNumber, verseNumber, reciterId = this.reciterId) {
        // Format: https://verses.quran.com/Alafasy/mp3/036001.mp3
        const paddedChapter = chapterNumber.toString().padStart(3, '0');
        const paddedVerse = verseNumber.toString().padStart(3, '0');
        return `https://verses.quran.com/Alafasy/mp3/${paddedChapter}${paddedVerse}.mp3`;
    }

    // Get all audio URLs for a chapter
    getChapterAudioUrls(chapterNumber, totalVerses, reciterId = this.reciterId) {
        const urls = [];
        for (let i = 1; i <= totalVerses; i++) {
            urls.push({
                verse: i,
                url: this.getAudioUrl(chapterNumber, i, reciterId)
            });
        }
        return urls;
    }

    // Download and process audio for fingerprint generation
    async downloadAudioForFingerprint(chapterNumber, verseNumber) {
        const audioUrl = this.getAudioUrl(chapterNumber, verseNumber);
        
        try {
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
        } catch (error) {
            console.error('Error downloading audio:', error);
            throw error;
        }
    }

    // Generate fingerprint for a verse
    async generateFingerprint(chapterNumber, verseNumber, audioProcessor) {
        try {
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
        } catch (error) {
            console.error('Error generating fingerprint:', error);
            throw error;
        }
    }

    // Batch generate fingerprints for entire chapter
    async generateChapterFingerprints(chapterNumber, totalVerses, audioProcessor, onProgress) {
        const fingerprints = [];
        
        for (let verse = 1; verse <= totalVerses; verse++) {
            try {
                const fingerprint = await this.generateFingerprint(
                    chapterNumber, 
                    verse, 
                    audioProcessor
                );
                fingerprints.push(fingerprint);
                
                if (onProgress) {
                    onProgress({
                        current: verse,
                        total: totalVerses,
                        percentage: Math.round((verse / totalVerses) * 100),
                        fingerprint
                    });
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error processing verse ${verse}:`, error);
                fingerprints.push({
                    chapter: chapterNumber,
                    verse: verse,
                    error: error.message
                });
            }
        }

        return fingerprints;
    }

    // Get reciter list
    async getReciters() {
        try {
            const response = await fetch(`${this.baseUrl}/resources/recitations?language=en`);
            const data = await response.json();
            return data.recitations;
        } catch (error) {
            console.error('Error fetching reciters:', error);
            throw error;
        }
    }

    // Get all verses for a chapter with audio AND text
    async getVersesWithAudio(chapterNumber, reciterId = this.reciterId) {
        const cacheKey = `verses_full_${chapterNumber}_${reciterId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/verses/by_chapter/${chapterNumber}?language=en&words=true&audio_recitation=${reciterId}&translations=131&transliterations=131`
            );
            const data = await response.json();
            this.cache.set(cacheKey, data.verses);
            return data.verses;
        } catch (error) {
            console.error('Error fetching verses:', error);
            throw error;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
const quranAPI = new QuranAPI();

// Popular reciters
const POPULAR_RECITERS = {
    7: { name: 'Mishary Rashid Alafasy', style: 'Clear, Moderate' },
    1: { name: 'AbdulBaset AbdulSamad', style: 'Mujawwad' },
    2: { name: 'Abdur-Rahman as-Sudais', style: 'Fast, Clear' },
    5: { name: 'Saad Al-Ghamdi', style: 'Smooth, Emotional' },
    11: { name: 'Mahmoud Khalil Al-Hussary', style: 'Tajweed-focused' }
};