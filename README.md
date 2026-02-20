# AyatFinder - Quran Verse Detector

A mobile-friendly web application that listens to Quran recitation and identifies the Surah and Ayah location.

## Features

- **Voice Capture** - Records audio directly from browser
- **Smart Matching** - Uses fuzzy matching algorithm to find verses
- **Mobile Optimized** - Works perfectly on phones
- **Beautiful UI** - Modern, clean design with animations
- **Copy Results** - Easy sharing of detected verses
- **No Backend Required** - Works entirely in browser

## Quick Start

### Option 1: Direct Testing (Easiest)
1. Save the `index.html` file to your computer
2. Open it directly in Chrome, Edge, or Safari
3. Allow microphone permission when prompted
4. Click the microphone button and recite!

### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Then open http://localhost:8000
