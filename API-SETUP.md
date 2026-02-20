# 📡 Quran.com API Integration Guide

## Overview

AyatFinder uses the official [Quran.com API v4](https://quran.com/api/v4) to fetch reference audio and generate fingerprints automatically. This is free, legal, and requires no API key.

---

## 🔑 API Information

| Detail | Value |
|--------|-------|
| **API Provider** | Quran.com |
| **API Version** | v4 |
| **API Key Required** | ❌ No (Free) |
| **Rate Limit** | ~100 requests/minute |
| **CORS Support** | ✅ Yes |
| **Documentation** | https://quran.com/api/v4 |

---

## 🎵 Audio URL Format

Quran.com provides direct audio URLs for all verses:

https://verses.quran.com/{ReciterName}/{format}/{ChapterVerse}.mp3


### Example URLs

| Surah | Ayah | URL |
|-------|------|-----|
| Yasin (36) | 1 | `https://verses.quran.com/Alafasy/mp3/036001.mp3` |
| Yasin (36) | 2 | `https://verses.quran.com/Alafasy/mp3/036002.mp3` |
| Al-Mulk (67) | 1 | `https://verses.quran.com/Alafasy/mp3/067001.mp3` |
| Al-Fatiha (1) | 1 | `https://verses.quran.com/Alafasy/mp3/001001.mp3` |

### Format Rules

- **Chapter Number**: 3 digits (pad with zeros)
  - `1` → `001`
  - `36` → `036`
  - `112` → `112`
  
- **Verse Number**: 3 digits (pad with zeros)
  - `1` → `001`
  - `10` → `010`
  - `83` → `083`

---

## 🎤 Available Reciters

| ID | Reciter Name | Style | Recommended For |
|----|--------------|-------|-----------------|
| 1 | AbdulBaset AbdulSamad | Mujawwad (Slow) | Learning Tajweed |
| 2 | Abdur-Rahman as-Sudais | Fast, Clear | Quick Recognition |
| 5 | Saad Al-Ghamdi | Smooth, Emotional | General Use |
| 7 | **Mishary Rashid Alafasy** | **Clear, Moderate** | **⭐ Best for MVP** |
| 11 | Mahmoud Khalil Al-Hussary | Tajweed-focused | Educational |

**Recommendation**: Use **Mishary Rashid Alafasy (ID: 7)** for MVP - clear pronunciation, moderate speed, widely recognized.

---

## 🛠️ How to Generate Fingerprints

### Method 1: Using Admin Tool (Easiest) ⭐

1. **Open Admin Tool**
   Open `admin.html` in your browser.

2. **Configure Settings**
   - Select Surah: `Yasin (36)` or `Al-Mulk (67)`
   - Select Reciter: `Mishary Rashid Alafasy`
   - Verse Range: `1` to `10` (start small)

3. **Generate**
   - Click "Start Fingerprint Generation"
   - Wait for processing (about 1-2 seconds per verse)
   - Watch progress bar

4. **Download**
   - Click "Download JSON"
   - Save file to `fingerprints/` folder
   - Copy fingerprints to `js/quran-data.js`

### Method 2: Using JavaScript Code

```javascript
// Generate single fingerprint
const fingerprint = await quranAPI.generateFingerprint(
    36,              // Surah number
    1,               // Verse number
    audioProcessor   // Audio processor instance
);

console.log(fingerprint);
// Output:
// {
//   chapter: 36,
//   verse: 1,
//   duration: 2.5,
//   fingerprint: {
//     duration: 2.5,
//     energy: 0.18,
//     zcr: 0.12,
//     centroid: 950,
//     dominantFreqs: [280, 450, 680, 920]
//   },
//   audioUrl: "https://verses.quran.com/Alafasy/mp3/036001.mp3"
// }

Method 3: Batch Generate Entire Surah

// Generate all fingerprints for a chapter
const fingerprints = await quranAPI.generateChapterFingerprints(
    36,              // Surah number
    83,              // Total verses in Yasin
    audioProcessor,
    (progress) => {
        console.log(`Progress: ${progress.current}/${progress.total}`);
    }
);

// Save to file
const json = JSON.stringify(fingerprints, null, 2);
// Download or copy to quran-data.js