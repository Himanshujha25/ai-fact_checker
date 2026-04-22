document.addEventListener('DOMContentLoaded', async () => {
    const auditText = document.getElementById('auditText');
    const auditBtn = document.getElementById('auditBtn');
    const urlAuditBtn = document.getElementById('urlAuditBtn');
    const reputationCard = document.getElementById('reputationCard');
    const reputationBadge = document.getElementById('reputationBadge');
    const reputationReason = document.getElementById('reputationReason');
    const domainLabel = document.getElementById('domainLabel');

    // Get current tab info
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    
    if (tab && tab.url) {
        // Fetch reputation from storage (set by background.js)
        chrome.storage.local.get([tab.url], (result) => {
            const data = result[tab.url];
            if (data) {
                reputationCard.style.display = 'block';
                domainLabel.textContent = data.domain || 'This Site';
                reputationBadge.textContent = data.status || 'Neutral';
                reputationBadge.className = `badge badge-${(data.status || 'neutral').toLowerCase()}`;
                reputationReason.textContent = data.reason || `Type: ${data.type || 'Standard Site'}`;
            }
        });

        // Auto-populate from selection - ONLY on valid web pages
        if (tab.url.startsWith('http')) {
            try {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => window.getSelection().toString()
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        auditText.value = results[0].result;
                    }
                });
            } catch (e) {
                console.warn('Selection capture blocked by browser security policy.');
            }
        }
    }

    auditBtn.addEventListener('click', () => {
        const text = auditText.value.trim();
        if (text) {
            chrome.runtime.sendMessage({ action: "openVerification", text });
        }
    });

    urlAuditBtn.addEventListener('click', () => {
        if (tab && tab.url) {
            chrome.runtime.sendMessage({ action: "openVerification", text: tab.url });
        }
    });

    auditText.focus();
});
