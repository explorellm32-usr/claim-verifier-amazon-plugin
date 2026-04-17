# Claim Verifier Shopping Assistant
A Chrome extension powered by Gemini 3.1 Flash Lite Preview. It uses AI to read an Amazon product's claims and cross-reference them against real customer reviews to tell you if the product is legitimately good, partially true, or false.

## Features
- **AI Verdicts:** Computes an unbiased `TRUE`, `PARTIALLY TRUE` or `FALSE` verdict and a quick summary.
- **Evidence Formatting:** Extracts direct string quotes from customer reviews as proof.
- **Bot/Fake Review Detection:** Scans the text for paid-actor style repetitions and alerts you directly in the popup.

## Installation for Development
1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** and select this directory.
5. Once installed, click the "Extensions" puzzle piece in Chrome and pin the "Claim Verifier" to your toolbar.
6. Right-click the extension icon and click **Options** (or click it and tap the link) to enter your Google Gemini API Key.
7. Browse to any Amazon product page and give it a try!

## Tech Stack
- Manifest V3 Chrome Extension
- Vanilla Javascript & HTML/CSS (Glassmorphism / Dark Mode)
- Google Gemini 3.1 Flash Lite Preview (`generativelanguage.googleapis.com`)
