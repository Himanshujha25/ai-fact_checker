document.getElementById('auditBtn').addEventListener('click', () => {
  const text = document.getElementById('auditText').value.trim();
  if (text) {
    chrome.runtime.sendMessage({ action: "openVerification", text: text });
  }
});

document.getElementById('urlAuditBtn').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url) {
      chrome.runtime.sendMessage({ action: "openVerification", text: activeTab.url });
    }
  });
});

// Auto-populate from selection if possible
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (!tabs[0]) return;
  chrome.scripting.executeScript({
    target: {tabId: tabs[0].id},
    function: () => window.getSelection().toString()
  }, (results) => {
    if (results && results[0] && results[0].result) {
      document.getElementById('auditText').value = results[0].result;
    }
  });
});
