// content.js - NotebookLM 页面注入脚本

(function() {
  'use strict';

  // 检查是否在 NotebookLM 页面
  if (!window.location.hostname.includes('notebooklm.google.com')) {
    return;
  }

  // 创建浮动按钮
  function createFloatingButton() {
    // 避免重复创建
    if (document.getElementById('nlm-chapter-splitter-btn')) {
      return;
    }

    const button = document.createElement('div');
    button.id = 'nlm-chapter-splitter-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <span>拆分书籍</span>
    `;

    // 设置样式
    Object.assign(button.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '24px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '10000',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    // 悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    // 点击事件
    button.addEventListener('click', () => {
      // 提示用户点击扩展图标
      showNotification();
    });

    document.body.appendChild(button);
  }

  // 显示通知
  function showNotification() {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.textContent = '请点击浏览器工具栏中的扩展图标来使用书籍拆分功能';
    Object.assign(notification.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      background: 'white',
      color: '#333',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '10001',
      fontSize: '14px',
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    document.body.appendChild(notification);

    // 3秒后自动消失
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // 添加动画样式
  function addAnimationStyles() {
    if (document.getElementById('nlm-splitter-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'nlm-splitter-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 等待页面加载完成
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        addAnimationStyles();
        createFloatingButton();
      });
    } else {
      addAnimationStyles();
      createFloatingButton();
    }
  }

  // 监听页面变化（SPA 导航）
  const observer = new MutationObserver(() => {
    if (!document.getElementById('nlm-chapter-splitter-btn')) {
      createFloatingButton();
    }
  });

  init();

  // 观察文档变化
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'uploadChapters') {
      console.log('收到章节上传请求:', message.chapters.length);
      // 这里可以实现自动上传到 NotebookLM 的功能
      // 需要根据 NotebookLM 的实际 API 或界面结构来实现
      sendResponse({ success: true, message: '收到上传请求' });
    }
  });

  console.log('NotebookLM 章节拆分工具 Content Script 已加载');
})();
