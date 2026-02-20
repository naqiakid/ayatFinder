// Main Application Logic

let isRecording = false;
let audioContext = null;
let analyser = null;
let microphone = null;
let mediaRecorder = null;
let audioChunks = [];
let animationFrame = null;
let recordingStartTime = 0;
let selectedSurah = 'yasin';
let timerInterval = null;

// DOM Elements
const micButton = document.getElementById('mic-button');
const micText = document.getElementById('mic-text');
const micIcon = document.getElementById('mic-icon');
const pulseRing = document.getElementById('pulse-ring');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const timerDisplay = document.getElementById('timer-display');
const recordingTimer = document.getElementById('recording-timer');
const timerBar = document.getElementById('timer-bar');
const waveformCanvas = document.getElementById('waveform-canvas');
const waveformCtx = waveformCanvas.getContext('2d');
const audioLevelDisplay = document.getElementById('audio-level');
const featuresContainer = document.getElementById('features-container');
const resultCard = document.getElementById('result-card');
const errorCard = document.getElementById('error-card');
const processingCard = document.getElementById('processing-card');

// Initialize canvas
function initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = waveformCanvas.getBoundingClientRect();
    waveformCanvas.width = rect.width * dpr;
    waveformCanvas.height = rect.height * dpr;
    waveformCtx.scale(dpr, dpr);
}
initCanvas();
window.addEventListener('resize', initCanvas);

// Select Surah
function selectSurah(surah) {
    selectedSurah = surah;
    document.getElementById('btn-yasin').className = 
        surah === 'yasin' ? 'surah-btn active bg-emerald-600/50 border-emerald-500' : 'surah-btn bg-white/5 border-white/20';
    document.getElementById('btn-mulk').className = 
        surah === 'mulk' ? 'surah-btn active bg-emerald-600/50 border-emerald-500' : 'surah-btn bg-white/5 border-white/20';
    statusDesc.textContent = `Surah ${surah === 'yasin' ? 'Yasin (36)' : 'Al-Mulk (67)'} • 5-10 seconds`;
}

// Update Timer
function updateTimer() {
    const elapsed = Date.now() - recordingStartTime;
    const seconds = Math.min(Math.floor(elapsed / 1000), RECORDING_SETTINGS.maxLength);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    recordingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    timerBar.style.width = `${(seconds / RECORDING_SETTINGS.maxLength) * 100}%`;

    // Auto-stop at max length
    if (seconds >= RECORDING_SETTINGS.maxLength) {
        stopRecording();
    }
}

// Draw Waveform
function drawWaveform(dataArray) {
    const width = waveformCanvas.width / (window.devicePixelRatio || 1);
    const height = waveformCanvas.height / (window.devicePixelRatio || 1);

    waveformCtx.clearRect(0, 0, width, height);
    waveformCtx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    waveformCtx.fillRect(0, 0, width, height);

    waveformCtx.beginPath();
    waveformCtx.strokeStyle = '#10b981';
    waveformCtx.lineWidth = 2;

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;
        if (i === 0) waveformCtx.moveTo(x, y);
        else waveformCtx.lineTo(x, y);
        x += sliceWidth;
    }

    waveformCtx.lineTo(width, height / 2);
    waveformCtx.stroke();

    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const db = Math.round(20 * Math.log10(avg / 128 + 0.001));
    audioLevelDisplay.textContent = `${db} dB`;
}

// Start Recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: RECORDING_SETTINGS.sampleRate
            } 
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        });

        audioChunks = [];
        recordingStartTime = Date.now();

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processAudio(audioBlob);
        };

        mediaRecorder.start();
        isRecording = true;
        updateUI('recording');
        animateWaveform();
        
        // Start timer
        timerInterval = setInterval(updateTimer, 100);

    } catch (err) {
        console.error('Recording error:', err);
        showError('Could not access microphone. Please check permissions.');
    }
}

// Stop Recording
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        cancelAnimationFrame(animationFrame);
        clearInterval(timerInterval);

        if (microphone) {
            microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }

        // Check minimum recording length
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        if (elapsed < RECORDING_SETTINGS.minLength) {
            showError(`Recording too short (${elapsed.toFixed(1)}s). Please record at least ${RECORDING_SETTINGS.minLength} seconds.`);
            updateUI('idle');
            return;
        }

        updateUI('processing');
    }
}

// Animate Waveform
function animateWaveform() {
    if (!isRecording) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    drawWaveform(dataArray);
    animationFrame = requestAnimationFrame(animateWaveform);
}

// Process Audio
async function processAudio(audioBlob) {
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodeContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await decodeContext.decodeAudioData(arrayBuffer);

        // Extract features
        const features = await audioProcessor.extractAllFeatures(audioBuffer);
        displayFeatures(features);

        // Match with database
        const matches = fingerprintMatcher.match(selectedSurah, features);

        console.log('Top 3 matches:', matches.slice(0, 3));

        // Check match quality
        if (matches[0].score >= MATCH_THRESHOLDS.minimum) {
            displayResult(matches[0].ayah, matches[0].score);
        } else {
            showError(`Best match: ${matches[0].score}%. Try reciting more clearly.`);
        }

        decodeContext.close();

    } catch (err) {
        console.error('Processing error:', err);
        showError('Error processing audio: ' + err.message);
    }
}

// Display Features
function displayFeatures(features) {
    featuresContainer.classList.remove('hidden');
    document.getElementById('feature-duration').textContent = features.duration.toFixed(2) + 's';
    document.getElementById('feature-energy').textContent = features.energy.toFixed(3);
    document.getElementById('feature-zcr').textContent = features.zcr.toFixed(3);
    document.getElementById('feature-centroid').textContent = Math.round(features.centroid) + ' Hz';
}

// Update UI
function updateUI(state) {
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    processingCard.classList.add('hidden');

    switch(state) {
        case 'idle':
            micButton.className = 'mic-button-idle relative w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg transition-all duration-300 active:scale-95';
            micText.textContent = 'Start Recording';
            micIcon.innerHTML = '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>';
            pulseRing.classList.add('hidden');
            timerDisplay.classList.add('hidden');
            statusTitle.textContent = 'Ready to Listen';
            micButton.disabled = false;
            waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
            break;

        case 'recording':
            micButton.className = 'mic-button-active relative w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg transition-all duration-300 active:scale-95';
            micText.textContent = 'Stop Recording';
            micIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" fill="currentColor"></rect>';
            pulseRing.classList.remove('hidden');
            timerDisplay.classList.remove('hidden');
            statusTitle.textContent = 'Listening...';
            micButton.disabled = false;
            break;

        case 'processing':
            timerDisplay.classList.add('hidden');
            statusTitle.textContent = 'Processing...';
            processingCard.classList.remove('hidden');
            micButton.disabled = true;
            micButton.classList.add('opacity-50', 'cursor-not-allowed', 'mic-button-processing');
            break;
    }
}

// Display Result
function displayResult(match, score) {
    processingCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');

    const surahName = selectedSurah === 'yasin' ? 'Yasin' : 'Al-Mulk';
    document.getElementById('result-surah').textContent = `Surah ${surahName}`;
    document.getElementById('result-ayah').textContent = `Ayah ${match.ayah}`;
    document.getElementById('result-arabic').textContent = match.arabic;
    document.getElementById('result-trans').textContent = match.transliteration;
    document.getElementById('result-translation').textContent = match.translation;
    document.getElementById('confidence-score').textContent = `${score}%`;
    document.getElementById('confidence-bar').style.width = `${score}%`;

    resultCard.classList.remove('hidden');
    statusTitle.textContent = '✓ Match Found!';
    statusDesc.textContent = `Confidence: ${score}%`;

    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
}

// Show Error
function showError(message) {
    processingCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    document.getElementById('error-message').textContent = message;
    errorCard.classList.remove('hidden');
    statusTitle.textContent = '⚠ No Match';
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
}

// Reset App
function resetApp() {
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    featuresContainer.classList.add('hidden');
    updateUI('idle');
    micButton.classList.remove('opacity-50', 'cursor-not-allowed', 'mic-button-processing');
}

// Copy Result
function copyResult() {
    const arabic = document.getElementById('result-arabic').textContent;
    const surah = document.getElementById('result-surah').textContent;
    const ayah = document.getElementById('result-ayah').textContent;
    const trans = document.getElementById('result-trans').textContent;
    const translation = document.getElementById('result-translation').textContent;
    const text = `${arabic}\n\n${surah} - ${ayah}\n\nTransliteration: ${trans}\n\nTranslation: ${translation}`;
    navigator.clipboard.writeText(text).then(() => {
        micText.textContent = '✓ Copied!';
        setTimeout(() => { micText.textContent = 'Start Recording'; }, 2000);
    });
}

// Event Listeners
micButton.addEventListener('click', () => {
    if (isRecording) stopRecording();
    else startRecording();
});

// Browser Check
window.addEventListener('load', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusTitle.textContent = '⚠ Microphone Required';
        micButton.disabled = true;
        micButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRecording) stopRecording();
});