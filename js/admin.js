// Admin Tool - Fingerprint Builder Logic
let isGenerating = false;
let generatedFingerprints = [];
let currentSurah = 36;
let currentReciter = 7;
let surahTotalVerses = 83;

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const progressContainer = document.getElementById('progress-container');
const resultsContainer = document.getElementById('results-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');

// Surah verse counts
const SURAH_VERSE_COUNTS = {
    1: 7,
    36: 83,
    67: 30,
    112: 4,
    113: 5,
    114: 6
};

// ⭐ HELPER: Extract and combine text from words array ⭐
function extractVerseText(verseData) {
    // Filter only actual words (exclude verse end markers)
    const words = verseData.words.filter(w => w.char_type_name === 'word');
    
    // Combine Arabic text
    const arabic = words.map(w => w.text).join(' ');
    
    // Combine transliteration
    const transliteration = words
        .map(w => w.transliteration?.text || '')
        .filter(t => t)
        .join(' ');
    
    // Combine translation
    const translation = words
        .map(w => w.translation?.text || '')
        .filter(t => t)
        .join(' ');
    
    return { arabic, transliteration, translation };
}

async function startGeneration() {
    const surahNumber = parseInt(document.getElementById('surah-select').value);
    const reciterId = parseInt(document.getElementById('reciter-select').value);

    currentSurah = surahNumber;
    currentReciter = reciterId;
    surahTotalVerses = SURAH_VERSE_COUNTS[surahNumber] || 83;

    isGenerating = true;
    generatedFingerprints = [];

    // Update UI
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    document.getElementById('fingerprints-list').innerHTML = '';

    try {
        // Fetch all verse metadata from Quran.com API
        const versesData = await quranAPI.getVersesWithAudio(surahNumber, reciterId);
        
        console.log(`Total verses fetched: ${versesData.length}`);
        console.log(`Sample verse:`, versesData[0]);
        
        for (let verseIndex = 0; verseIndex < versesData.length; verseIndex++) {
            if (!isGenerating) break;

            const verseData = versesData[verseIndex];
            const verseNumber = verseData.verse_key.split(':')[1];
            const current = verseIndex + 1;
            const percentage = Math.round((current / surahTotalVerses) * 100);
            
            // Update progress
            progressText.textContent = `Processing verse ${current} of ${surahTotalVerses}`;
            progressPercentage.textContent = `${percentage}%`;
            progressBar.style.width = `${percentage}%`;

            // Generate fingerprint
            const fingerprint = await quranAPI.generateFingerprint(
                surahNumber, 
                parseInt(verseNumber), 
                audioProcessor
            );

            // ⭐ Extract and combine text properly ⭐
            const textData = extractVerseText(verseData);

            const completeData = {
                id: parseInt(verseNumber),
                ayah: parseInt(verseNumber),
                arabic: verseData.text_imlaei || verseData.text_uthmani || "",
                transliteration: (verseData.transliterations && verseData.transliterations.length > 0) ? verseData.transliterations[0].text : "",
                translation: (verseData.translations && verseData.translations.length > 0) ? verseData.translations[0].text : "",
                audioUrl: fingerprint.audioUrl,
                fingerprint: fingerprint.fingerprint
            };

            console.log(`Verse ${verseNumber}:`, {
                arabic: completeData.arabic.substring(0, 30),
                transliteration: completeData.transliteration.substring(0, 30),
                translation: completeData.translation.substring(0, 30)
            });

            generatedFingerprints.push(completeData);

            // Update current verse display
            document.getElementById('current-verse-text').textContent = 
                `Surah ${surahNumber}, Verse ${verseNumber}`;
            document.getElementById('current-verse-arabic').textContent = 
                completeData.arabic || "-";
            document.getElementById('current-duration').textContent = 
                `${fingerprint.duration}s`;
            document.getElementById('current-energy').textContent = 
                fingerprint.fingerprint.energy;
            document.getElementById('current-centroid').textContent = 
                `${fingerprint.fingerprint.centroid} Hz`;

            // Add to list
            addFingerprintToList(completeData);

            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (isGenerating) {
            alert(`✅ Successfully generated ${generatedFingerprints.length} fingerprints for Surah ${currentSurah}!`);
        }

    } catch (error) {
        console.error('Generation error:', error);
        alert('❌ Error: ' + error.message);
    } finally {
        isGenerating = false;
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

function stopGeneration() {
    isGenerating = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    progressText.textContent = 'Stopped by user';
}

function addFingerprintToList(fingerprint) {
    const list = document.getElementById('fingerprints-list');
    const item = document.createElement('div');
    item.className = 'bg-white/5 rounded-xl p-4 border border-white/10';
    item.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <span class="text-white font-bold">Verse ${fingerprint.ayah}</span>
            <span class="text-emerald-400 text-sm">${fingerprint.fingerprint.duration}s</span>
        </div>
        <p class="arabic-text text-emerald-200 text-sm mb-2">${fingerprint.arabic.substring(0, 50)}...</p>
        <div class="grid grid-cols-3 gap-2 text-xs text-emerald-300/70">
            <div>Energy: <span class="text-white">${fingerprint.fingerprint.energy}</span></div>
            <div>ZCR: <span class="text-white">${fingerprint.fingerprint.zcr}</span></div>
            <div>Centroid: <span class="text-white">${fingerprint.fingerprint.centroid} Hz</span></div>
        </div>
    `;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
}

function downloadJSON() {
    const data = {
        surah: currentSurah,
        reciter: currentReciter,
        totalVerses: generatedFingerprints.length,
        generatedAt: new Date().toISOString(),
        fingerprints: generatedFingerprints
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fingerprints_surah${currentSurah}_reciter${currentReciter}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadQuranDataJS() {
    if (generatedFingerprints.length === 0) {
        alert('❌ Please generate fingerprints first!');
        return;
    }

    const surahName = currentSurah === 36 ? 'Yasin' : currentSurah === 67 ? 'Al-Mulk' : `Surah${currentSurah}`;
    const surahKey = currentSurah === 36 ? 'yasin' : currentSurah === 67 ? 'mulk' : `surah${currentSurah}`;
    
    let ayahsContent = generatedFingerprints.map(fp => `        {
            id: ${fp.id},
            ayah: ${fp.ayah},
            arabic: "${fp.arabic.replace(/"/g, '\\"')}",
            transliteration: "${fp.transliteration.replace(/"/g, '\\"')}",
            translation: "${fp.translation.replace(/"/g, '\\"')}",
            audioUrl: "${fp.audioUrl}",
            fingerprint: {
                duration: ${fp.fingerprint.duration},
                energy: ${fp.fingerprint.energy},
                zcr: ${fp.fingerprint.zcr},
                centroid: ${fp.fingerprint.centroid},
                dominantFreqs: [${fp.fingerprint.dominantFreqs.join(', ')}]
            }
        }`).join(',\n');

    const content = `// Quran Database - Surah ${surahName}
// Auto-generated from Quran.com API (Mishary Rashid Alafasy)
// Generated: ${new Date().toISOString()}

const QURAN_DATA = {
    ${surahKey}: {
        name: "${surahName}",
        number: ${currentSurah},
        totalAyahs: ${surahTotalVerses},
        reciter: "Mishary Rashid Alafasy",
        reciterId: ${currentReciter},
        lastUpdated: "${new Date().toISOString().split('T')[0]}",
        ayahs: [
${ayahsContent}
        ]
    }
};

// Recording settings
const RECORDING_SETTINGS = {
    minLength: 5,
    maxLength: 10,
    sampleRate: 44100,
    channels: 1
};

// Matching thresholds
const MATCH_THRESHOLDS = {
    excellent: 80,
    good: 60,
    fair: 40,
    minimum: 30
};

// Available reciters
const AVAILABLE_RECITERS = {
    7: { name: 'Mishary Rashid Alafasy', style: 'Clear, Moderate' },
    1: { name: 'AbdulBaset AbdulSamad', style: 'Mujawwad' },
    2: { name: 'Abdur-Rahman as-Sudais', style: 'Fast, Clear' },
    5: { name: 'Saad Al-Ghamdi', style: 'Smooth, Emotional' },
    11: { name: 'Mahmoud Khalil Al-Hussary', style: 'Tajweed-focused' }
};
`;

    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quran-data-surah${currentSurah}.js`;
    a.click();
    URL.revokeObjectURL(url);
}

function copyToClipboard() {
    const text = JSON.stringify(generatedFingerprints, null, 2);
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Copied to clipboard!');
    }).catch(() => {
        alert('❌ Failed to copy');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fingerprint Builder Ready');
    console.log('Quran.com API:', quranAPI.baseUrl);
});