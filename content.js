// content.js - Injected into Amazon pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        try {
            // Get product claims (bullet points)
            const bulletEls = document.querySelectorAll('#feature-bullets li span.a-list-item');
            let claimsArray = [];
            if (bulletEls.length > 0) {
                bulletEls.forEach((el, index) => {
                    // Limit up to max 10 bullet points so we don't grab garbage.
                    if (index < 10) claimsArray.push(el.innerText.trim());
                });
            } else {
                const fallbackEl = document.getElementById('feature-bullets');
                if (fallbackEl) claimsArray = [fallbackEl.innerText.substring(0, 1500)];
            }

            // Get global rating
            const globalRatingEl = document.querySelector('[data-hook="rating-out-of-text"]') || document.querySelector('#acrPopover') || document.querySelector('.a-icon-star span.a-icon-alt');
            let overallRating = globalRatingEl ? globalRatingEl.innerText.trim() : "Unknown overall rating";

            // Get top 10 reviews with text and ratings
            const reviewBlocks = document.querySelectorAll('div[data-hook="review"]');
            let reviews = "";
            let count = 0;
            
            if (reviewBlocks.length > 0) {
                reviewBlocks.forEach((block) => {
                    if(count < 10) { 
                        const ratingEl = block.querySelector('.a-icon-alt');
                        const bodyEl = block.querySelector('[data-hook="review-body"]');
                        
                        const rating = ratingEl ? ratingEl.innerText.trim() : "Unknown rating";
                        const body = bodyEl ? bodyEl.innerText.trim() : "";
                        
                        if (body) {
                            reviews += `Review ${count+1} (${rating}): ${body}\n\n`;
                            count++;
                        }
                    }
                });
            } else {
                // Fallback
                const reviewEls = document.querySelectorAll('[data-hook="review-body"]');
                reviewEls.forEach((el) => {
                    if(count < 10) { 
                        reviews += `Review ${count+1}: ${el.innerText.trim()}\n\n`;
                        count++;
                    }
                });
            }

            if(!reviews) reviews = "No visible text reviews found. The product might be new or use a different layout.";

            sendResponse({ success: true, claims: claimsArray, reviews, overallRating });
        } catch (e) {
            sendResponse({ success: false, error: e.toString() });
        }
    }
    return true; // Keep message channel open for async if needed
});
