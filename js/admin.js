// Admin Tool - Fingerprint Builder Logic

let isGenerating = false;
let generatedFingerprints = [];
let currentSurah = 36;
let currentReciter = 7;

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const progressContainer = document.getElementById('progress-container');
const resultsContainer = document.getElementById('results-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');

async function startGeneration() {
    const surahNumber = parseInt(document.getElementById('surah-select').value);
    const reciterId = parseInt(document.getElementById('reciter-select').value);
    const verseFrom = parseInt(document.getElementById('verse-from').value);
    const verseTo = parseInt(document.getElementById('verse-to').value);

    if (verseFrom > verseTo) {
        alert('Invalid verse range!');
        return;
    }

    currentSurah = surahNumber;
    currentReciter = reciterId;
    isGenerating = true;
    generatedFingerprints = [];

    // Update UI
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    document.getElementById('fingerprints-list').innerHTML = '';

    try {
        const totalVerses = verseTo - verseFrom + 1;
        
        for (let verse = verseFrom; verse <= verseTo; verse++) {
            if (!isGenerating) break;

            // Update progress
            const current = verse - verseFrom + 1;
            const percentage = Math.round((current / totalVerses) * 100);
            
            progressText.textContent = `Processing verse ${current} of ${totalVerses}`;
            progressPercentage.textContent = `${percentage}%`;
            progressBar.style.width = `${percentage}%`;

            // Generate fingerprint
            const fingerprint = await quranAPI.generateFingerprint(
                surahNumber, 
                verse, 
                audioProcessor
            );

            generatedFingerprints.push(fingerprint);

            // Update current verse display
            document.getElementById('current-verse-text').textContent = 
                `Surah ${surahNumber}, Verse ${verse}`;
            document.getElementById('current-duration').textContent = 
                `${fingerprint.duration}s`;
            document.getElementById('current-energy').textContent = 
                fingerprint.fingerprint.energy;
            document.getElementById('current-centroid').textContent = 
                `${fingerprint.fingerprint.centroid} Hz`;

            // Add to list
            addFingerprintToList(fingerprint);

            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (isGenerating) {
            alert(`✅ Successfully generated ${generatedFingerprints.length} fingerprints!`);
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
            <span class="text-white font-bold">Verse ${fingerprint.verse}</span>
            <span class="text-emerald-400 text-sm">${fingerprint.duration}s</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs text-emerald-300/70">
            <div>Energy: <span class="text-white">${fingerprint.fingerprint.energy}</span></div>
            <div>ZCR: <span class="text-white">${fingerprint.fingerprint.zcr}</span></div>
            <div>Centroid: <span class="text-white">${fingerprint.fingerprint.centroid} Hz</span></div>
        </div>
    `;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
}

function downloadFingerprints() {
    const data = {
        surah: currentSurah,
        reciter: currentReciter,
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