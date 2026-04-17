document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const resultBox = document.getElementById('resultBox');
  const btn = document.getElementById('analyzeBtn');

  statusEl.innerText = "Analyzing page...";
  btn.disabled = true;
  resultBox.classList.add('hidden');

  // Query active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes("amazon.")) {
    statusEl.innerText = "Please open an Amazon product page.";
    btn.disabled = false;
    return;
  }

  // Inject content script if not already there, then send message
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    chrome.tabs.sendMessage(tab.id, { action: "scrape" }, async (response) => {
      if (!response || !response.success) {
        statusEl.innerText = "Failed to scrape product data. Are you sure this is a product page?";
        btn.disabled = false;
        return;
      }

      statusEl.innerText = "Consulting Gemini 3.1 Flash Lite...";
      const { claims, reviews, overallRating } = response;
      await analyzeWithGemini(claims, reviews, overallRating, tab.id);
    });
  } catch (e) {
    statusEl.innerText = "Error injecting script. Try refreshing the page.";
    btn.disabled = false;
  }
});

async function analyzeWithGemini(claims, reviews, overallRating, tabId) {
  chrome.storage.local.get(['geminiApiKey'], async (result) => {
    const apiKey = result.geminiApiKey;
    if (!apiKey) {
      document.getElementById('status').innerHTML = "API Key missing. <a href='#' id='openOptions'>Click here to add it</a>.";
      document.getElementById('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
      document.getElementById('analyzeBtn').disabled = false;
      return;
    }

    const claimsText = Array.isArray(claims) ? claims.map((c, i) => `[Bullet ${i}] ${c}`).join('\n') : claims;

    const prompt = `You are a shopping assistant 'Claim Verifier'. The user is looking at an Amazon product.
  Look at the claims made by the seller, and compare them against the overall product rating and the top 10 customer reviews. Also check if the reviews look like bot/fake reviews.
  
  Overall Rating: ${overallRating}
  Claims: ${claimsText}
  Top Reviews (with individual ratings): 
  ${reviews}
  
  Are the claims true, partially true, or false? Consider how the star ratings align with the text of the reviews. 
  Respond strictly in JSON format (no markdown formatting, just pure JSON):
  {
    "verdict": "TRUE" or "PARTIALLY TRUE" or "FALSE",
    "summary": "2-3 short sentences explaining your verdict purely based on evidence from the reviews.",
    "evidence_quote": "A single exact quote from one of the reviews that proves your verdict.",
    "fake_reviews_detected": true or false
  }`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API call failed: ${res.status} ${res.statusText} - ${errText}`);
      }

      const jsonRes = await res.json();

      if (jsonRes.error) {
        throw new Error(jsonRes.error.message);
      }

      let text = jsonRes.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);

      document.getElementById('status').innerText = "Analysis Complete!";

      const resultBox = document.getElementById('resultBox');
      const verdictBadge = document.getElementById('verdictBadge');
      const summaryText = document.getElementById('summaryText');
      const evidenceBox = document.getElementById('evidenceBox');
      const evidenceQuote = document.getElementById('evidenceQuote');
      const fakeReviewWarning = document.getElementById('fakeReviewWarning');

      verdictBadge.innerText = parsed.verdict;
      verdictBadge.className = '';
      if (parsed.verdict === 'TRUE') verdictBadge.classList.add('badge-true');
      else if (parsed.verdict === 'PARTIALLY TRUE') verdictBadge.classList.add('badge-exaggerated');
      else verdictBadge.classList.add('badge-false');

      summaryText.innerText = parsed.summary;
      
      if (parsed.evidence_quote) {
        evidenceBox.classList.remove('hidden');
        evidenceQuote.innerText = `"${parsed.evidence_quote}"`;
      } else {
        evidenceBox.classList.add('hidden');
      }

      if (parsed.fake_reviews_detected) {
        fakeReviewWarning.classList.remove('hidden');
      } else {
        fakeReviewWarning.classList.add('hidden');
      }

      resultBox.classList.remove('hidden');
      document.getElementById('analyzeBtn').disabled = false;

    } catch (error) {
      console.error(error);
      document.getElementById('status').innerText = `Error: ${error.message}`;
      document.getElementById('analyzeBtn').disabled = false;
    }
  });
}
