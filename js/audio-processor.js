// Audio Feature Extraction Engine

class AudioProcessor {
    constructor() {
        this.sampleRate = RECORDING_SETTINGS.sampleRate;
        this.fftSize = 2048;
    }

    // Calculate RMS Energy
    calculateEnergy(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        return Math.sqrt(sum / channelData.length);
    }

    // Calculate Zero Crossing Rate
    calculateZCR(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let crossings = 0;
        for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0 && channelData[i-1] < 0) ||
                (channelData[i] < 0 && channelData[i-1] >= 0)) {
                crossings++;
            }
        }
        return crossings / channelData.length;
    }

    // Calculate Spectral Centroid
    async calculateSpectralCentroid(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        let total = 0;
        
        for (let i = 0; i < channelData.length; i++) {
            const amplitude = Math.abs(channelData[i]);
            sum += amplitude * (i / channelData.length) * (this.sampleRate / 2);
            total += amplitude;
        }
        
        return total > 0 ? sum / total : 0;
    }

    // Extract frequency spectrum
    extractSpectrum(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const fftSize = this.fftSize;
        const spectrum = new Float32Array(fftSize / 2);
        
        for (let freq = 0; freq < fftSize / 2; freq++) {
            let real = 0;
            let imag = 0;
            const n = Math.min(channelData.length, fftSize);
            
            for (let t = 0; t < n; t++) {
                const angle = (2 * Math.PI * freq * t) / n;
                real += channelData[t] * Math.cos(angle);
                imag -= channelData[t] * Math.sin(angle);
            }
            
            spectrum[freq] = Math.sqrt(real * real + imag * imag) / n;
        }
        
        return spectrum;
    }

    // Find dominant frequencies
    findDominantFrequencies(spectrum, count = 4) {
        const freqs = [];
        const spectrumCopy = Array.from(spectrum);
        
        for (let i = 0; i < count; i++) {
            let maxIndex = 0;
            let maxValue = 0;
            
            for (let j = 0; j < spectrumCopy.length; j++) {
                if (spectrumCopy[j] > maxValue) {
                    maxValue = spectrumCopy[j];
                    maxIndex = j;
                }
            }
            
            if (maxValue > 0) {
                const freq = Math.round(maxIndex * this.sampleRate / this.fftSize);
                if (freq > 50 && freq < 5000) {
                    freqs.push(freq);
                }
                spectrumCopy[maxIndex] = 0;
            }
        }
        
        return freqs.sort((a, b) => a - b);
    }

    // Extract all features
    async extractAllFeatures(audioBuffer) {
        const duration = audioBuffer.duration;
        const energy = this.calculateEnergy(audioBuffer);
        const zcr = this.calculateZCR(audioBuffer);
        const centroid = await this.calculateSpectralCentroid(audioBuffer);
        const spectrum = this.extractSpectrum(audioBuffer);
        const dominantFreqs = this.findDominantFrequencies(spectrum);
        
        return {
            duration,
            energy,
            zcr,
            centroid,
            dominantFreqs
        };
    }
}

const audioProcessor = new AudioProcessor();