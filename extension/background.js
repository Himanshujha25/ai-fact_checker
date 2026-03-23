// Truecast Eye - Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "audit-selection",
    title: "Audit with Truecast",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "audit-page",
    title: "Analyze Page URL",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const baseUrl = "http://localhost:3000/verify";
  let targetUrl = "";

  if (info.menuItemId === "audit-selection") {
    targetUrl = `${baseUrl}?text=${encodeURIComponent(info.selectionText)}`;
  } else if (info.menuItemId === "audit-page") {
    targetUrl = `${baseUrl}?text=${encodeURIComponent(tab.url)}`;
  }

  if (targetUrl) {
    chrome.tabs.create({ url: targetUrl });
  }
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openVerification") {
    const baseUrl = "http://localhost:3000/verify";
    const targetUrl = `${baseUrl}?text=${encodeURIComponent(request.text)}`;
    chrome.tabs.create({ url: targetUrl });
    sendResponse({ success: true });
  }
});
