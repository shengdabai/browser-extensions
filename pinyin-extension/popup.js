// Popup脚本 - 管理插件设置

document.addEventListener('DOMContentLoaded', async () => {
  const enableSwitch = document.getElementById('enableSwitch');
  const pinyinSwitch = document.getElementById('pinyinSwitch');
  const translationSwitch = document.getElementById('translationSwitch');
  const status = document.getElementById('status');

  // 加载当前设置
  try {
    const result = await chrome.storage.sync.get([
      'pinyinEnabled',
      'showPinyin',
      'showTranslation'
    ]);

    // 默认值：全部启用
    enableSwitch.checked = result.pinyinEnabled !== false;
    pinyinSwitch.checked = result.showPinyin !== false;
    translationSwitch.checked = result.showTranslation !== false;
  } catch (e) {
    // 如果加载失败，使用默认值
    enableSwitch.checked = true;
    pinyinSwitch.checked = true;
    translationSwitch.checked = true;
  }

  // 显示保存状态
  function showStatus(message = '设置已保存') {
    status.textContent = message;
    status.classList.add('show');
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  }

  // 保存启用状态
  enableSwitch.addEventListener('change', async (e) => {
    try {
      await chrome.storage.sync.set({ pinyinEnabled: e.target.checked });
      showStatus(e.target.checked ? '插件已启用' : '插件已禁用');
    } catch (err) {
      console.error('保存设置失败', err);
      showStatus('保存失败，请重试');
    }
  });

  // 保存拼音显示设置
  pinyinSwitch.addEventListener('change', async (e) => {
    try {
      await chrome.storage.sync.set({ showPinyin: e.target.checked });
      showStatus('设置已保存');
    } catch (err) {
      console.error('保存设置失败', err);
      showStatus('保存失败，请重试');
    }
  });

  // 保存翻译显示设置
  translationSwitch.addEventListener('change', async (e) => {
    try {
      await chrome.storage.sync.set({ showTranslation: e.target.checked });
      showStatus('设置已保存');
    } catch (err) {
      console.error('保存设置失败', err);
      showStatus('保存失败，请重试');
    }
  });
});
