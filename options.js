document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            document.getElementById('apiKey').value = result.geminiApiKey;
        }
    });
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const key = document.getElementById('apiKey').value.trim();
    chrome.storage.local.set({ geminiApiKey: key }, () => {
        const status = document.getElementById('status');
        status.textContent = "API Key saved securely to local storage!";
        setTimeout(() => status.textContent = '', 3000);
    });
});
