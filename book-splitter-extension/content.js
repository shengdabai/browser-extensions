// Content Script - 在 NotebookLM 页面中注入功能

(function() {
  'use strict';

  // 检查是否在 NotebookLM 页面
  if (!window.location.hostname.includes('notebooklm.google.com')) {
    return;
  }

  // 创建浮动按钮
  function createFloatingButton() {
    const button = document.createElement('div');
    button.id = 'book-splitter-btn';
    button.innerHTML = '📚 拆分书籍';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4285f4;
      color: white;
      padding: 12px 20px;
      border-radius: 24px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#357ae8';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#4285f4';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', () => {
      // 提示用户点击扩展图标
      alert('请点击浏览器工具栏中的扩展图标来使用书籍拆分功能');
      // 或者尝试打开扩展的 popup 页面
      chrome.runtime.sendMessage({ action: 'openPopup' }, (response) => {
        if (chrome.runtime.lastError) {
          // 如果无法打开，提示用户手动点击
          console.log('请手动点击扩展图标');
        }
      });
    });

    document.body.appendChild(button);
  }

  // 等待页面加载完成后添加按钮
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'uploadChapters') {
      // 在 NotebookLM 中上传章节
      uploadChaptersToNotebookLM(message.chapters);
      sendResponse({ success: true });
    }
  });

  // 将章节上传到 NotebookLM（需要根据实际 NotebookLM 界面调整）
  function uploadChaptersToNotebookLM(chapters) {
    console.log('准备上传章节到 NotebookLM:', chapters.length);
    
    // 这里需要根据 NotebookLM 的实际界面结构来实现
    // 由于 NotebookLM 的界面可能会变化，这里提供一个基础框架
    
    // 查找上传按钮或输入框
    const uploadButton = document.querySelector('[aria-label*="上传"], [aria-label*="Upload"], button[class*="upload"]');
    
    if (uploadButton) {
      // 模拟点击上传按钮
      uploadButton.click();
      
      // 等待文件选择对话框（实际实现可能需要使用 File API）
      setTimeout(() => {
        console.log('章节已准备好上传');
        // 实际的上传逻辑需要根据 NotebookLM 的 API 或界面来实现
      }, 500);
    } else {
      console.warn('未找到 NotebookLM 的上传按钮');
      alert('请手动在 NotebookLM 中上传拆分后的章节文件');
    }
  }
})();

