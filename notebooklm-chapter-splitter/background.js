// background.js - Service Worker

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  // install/update lifecycle — no action needed
});

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadFile') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    return true; // 保持消息通道开放
  }

  if (message.action === 'getStorage') {
    chrome.storage.local.get(message.keys, (result) => {
      sendResponse({ success: true, data: result });
    });
    return true;
  }

  if (message.action === 'setStorage') {
    chrome.storage.local.set(message.data, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

// 监听下载完成事件
chrome.downloads.onChanged.addListener((_delta) => {
  // download state change — no action needed
});
