// Background Service Worker - 处理下载请求和其他消息

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
    return true;
  }
  
  if (message.action === 'openPopup') {
    // 尝试打开 popup（实际上 content script 无法直接打开 popup）
    // 这里只是返回一个响应，提示用户手动点击
    sendResponse({ success: false, message: '请手动点击扩展图标' });
    return true;
  }
});

