// Audio Fingerprint Matching Algorithm

class FingerprintMatcher {
    constructor() {
        this.weights = {
            duration: 0.30,
            energy: 0.20,
            zcr: 0.15,
            centroid: 0.20,
            freqs: 0.15
        };
    }

    // Compare extracted features with reference fingerprint
    compareFeatures(extracted, reference) {
        let score = 0;

        // Duration match (30%)
        const durationDiff = Math.abs(extracted.duration - reference.duration);
        const durationScore = Math.max(0, 100 - (durationDiff / reference.duration) * 100);
        score += durationScore * this.weights.duration;

        // Energy match (20%)
        const energyDiff = Math.abs(extracted.energy - reference.energy);
        const energyScore = Math.max(0, 100 - (energyDiff / 0.5) * 100);
        score += energyScore * this.weights.energy;

        // ZCR match (15%)
        const zcrDiff = Math.abs(extracted.zcr - reference.zcr);
        const zcrScore = Math.max(0, 100 - (zcrDiff / 0.2) * 100);
        score += zcrScore * this.weights.zcr;

        // Spectral centroid match (20%)
        const centroidDiff = Math.abs(extracted.centroid - reference.centroid);
        const centroidScore = Math.max(0, 100 - (centroidDiff / 1000) * 100);
        score += centroidScore * this.weights.centroid;

        // Frequency match (15%)
        let freqMatch = 0;
        extracted.dominantFreqs.forEach(freq => {
            reference.dominantFreqs.forEach(refFreq => {
                if (Math.abs(freq - refFreq) < 150) {
                    freqMatch += 25;
                }
            });
        });
        score += Math.min(100, freqMatch) * this.weights.freqs;

        return Math.round(score);
    }

    // Match against all ayahs in selected surah
    match(selectedSurah, extractedFeatures) {
        const surahData = QURAN_DATA[selectedSurah];
        const matches = [];

        surahData.ayahs.forEach(ayah => {
            const score = this.compareFeatures(extractedFeatures, ayah.fingerprint);
            matches.push({
                ayah,
                score
            });
        });

        // Sort by score
        matches.sort((a, b) => b.score - a.score);

        return matches;
    }

    // Get match quality label
    getMatchQuality(score) {
        if (score >= MATCH_THRESHOLDS.excellent) return 'excellent';
        if (score >= MATCH_THRESHOLDS.good) return 'good';
        if (score >= MATCH_THRESHOLDS.fair) return 'fair';
        return 'poor';
    }
}

const fingerprintMatcher = new FingerprintMatcher();