// Truecast Eye - Background Service Worker
const API_BASE = "http://localhost:5000"; 
const FRONTEND_BASE = "http://localhost:5173"; 

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "audit-selection",
    title: "Audit text with Truecast",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "audit-page",
    title: "Analyze Page URL",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "audit-image",
    title: "Forensic Check Image",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let targetUrl = "";

  if (info.menuItemId === "audit-selection") {
    targetUrl = `${FRONTEND_BASE}/verify?text=${encodeURIComponent(info.selectionText)}`;
  } else if (info.menuItemId === "audit-page") {
    targetUrl = `${FRONTEND_BASE}/verify?text=${encodeURIComponent(tab.url)}`;
  } else if (info.menuItemId === "audit-image") {
    targetUrl = `${FRONTEND_BASE}/verify?text=${encodeURIComponent(info.srcUrl)}&mode=deepfake`;
  }

  if (targetUrl) {
    chrome.tabs.create({ url: targetUrl });
  }
});

// Listener for tab updates to perform background URL reputation checks
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    checkUrlReputation(tabId, tab.url);
  }
});

async function checkUrlReputation(tabId, url) {
  try {
    const response = await fetch(`${API_BASE}/api/url/reputation?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (data.status === 'Hazard' || data.status === 'Caution') {
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: data.status === 'Hazard' ? '#FF0000' : '#FFA500', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
    
    // Store reputation in local storage for popup access
    chrome.storage.local.set({ [url]: data });
  } catch (e) {
    console.warn('Reputation check failed:', e.message);
  }
}

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openVerification") {
    const targetUrl = `${FRONTEND_BASE}/verify?text=${encodeURIComponent(request.text)}`;
    chrome.tabs.create({ url: targetUrl });
    sendResponse({ success: true });
  }
});
