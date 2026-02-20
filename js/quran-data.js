// Quran Database - Surah Yasin & Al-Mulk
// Reference: Mishary Rashid Alafasy recitation

const QURAN_DATA = {
    yasin: {
        name: "Yasin",
        number: 36,
        totalAyahs: 83,
        ayahs: [
            {
                id: 1,
                ayah: 1,
                arabic: "يسٓ",
                transliteration: "Ya-Seen",
                translation: "Ya, Seen.",
                fingerprint: {
                    duration: 2.5,
                    energy: 0.18,
                    zcr: 0.12,
                    centroid: 950,
                    dominantFreqs: [280, 450, 680, 920]
                }
            },
            {
                id: 2,
                ayah: 2,
                arabic: "وَٱلْقُرْءَانِ ٱلْحَكِيمِ",
                transliteration: "Wal-qur'anil-hakim",
                translation: "By the wise Qur'an.",
                fingerprint: {
                    duration: 3.2,
                    energy: 0.22,
                    zcr: 0.14,
                    centroid: 1050,
                    dominantFreqs: [300, 480, 720, 980]
                }
            },
            {
                id: 3,
                ayah: 3,
                arabic: "إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ",
                transliteration: "Innaka laminal-mursalin",
                translation: "Indeed you are from among the messengers.",
                fingerprint: {
                    duration: 3.8,
                    energy: 0.24,
                    zcr: 0.15,
                    centroid: 1100,
                    dominantFreqs: [320, 500, 750, 1000]
                }
            },
            // Add more ayahs as you collect reference audio
            // MVP: Start with first 10 ayahs of each surah
        ]
    },
    mulk: {
        name: "Al-Mulk",
        number: 67,
        totalAyahs: 30,
        ayahs: [
            {
                id: 1,
                ayah: 1,
                arabic: "تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ",
                transliteration: "Tabarakal-lazi biyadihil-mulk",
                translation: "Blessed is He in whose hand is dominion.",
                fingerprint: {
                    duration: 4.5,
                    energy: 0.26,
                    zcr: 0.16,
                    centroid: 1150,
                    dominantFreqs: [340, 520, 780, 1050]
                }
            },
            {
                id: 2,
                ayah: 2,
                arabic: "وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
                transliteration: "Wa huwa ala kulli shay'in qadir",
                translation: "And He is over all things competent.",
                fingerprint: {
                    duration: 4.2,
                    energy: 0.25,
                    zcr: 0.15,
                    centroid: 1100,
                    dominantFreqs: [330, 510, 770, 1030]
                }
            },
            {
                id: 3,
                ayah: 3,
                arabic: "ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ",
                transliteration: "Allazi khalaqal-mawta wal-hayah",
                translation: "Who created death and life.",
                fingerprint: {
                    duration: 4.8,
                    energy: 0.27,
                    zcr: 0.17,
                    centroid: 1200,
                    dominantFreqs: [350, 530, 800, 1080]
                }
            },
            // Add more ayahs as you collect reference audio
        ]
    }
};

// Recording settings
const RECORDING_SETTINGS = {
    minLength: 5,  // Minimum 5 seconds
    maxLength: 10, // Maximum 10 seconds
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