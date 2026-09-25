// Popup脚本 - 管理插件设置

document.addEventListener('DOMContentLoaded', async () => {
  const enableSwitch = document.getElementById('enableSwitch');
  const pinyinSwitch = document.getElementById('pinyinSwitch');
  const translationSwitch = document.getElementById('translationSwitch');
  const status = document.getElementById('status');

  const translationSite = document.getElementById('translationSite');

  // 当前标签页的网站；翻译只对用户逐个开启的网站生效（默认关闭）
  let siteOrigin = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab && tab.url ? new URL(tab.url) : null;
    if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
      siteOrigin = url.origin;
    }
  } catch (e) {
    siteOrigin = null;
  }
  translationSite.textContent = siteOrigin ? new URL(siteOrigin).host : '此页面不支持翻译';
  translationSwitch.disabled = !siteOrigin;

  async function getTranslationSites() {
    const { translationSites } = await chrome.storage.sync.get('translationSites');
    return Array.isArray(translationSites) ? translationSites : [];
  }

  // 加载当前设置
  try {
    const result = await chrome.storage.sync.get(['pinyinEnabled', 'showPinyin']);

    // 拼音在本地生成，默认启用；翻译需按网站开启
    enableSwitch.checked = result.pinyinEnabled !== false;
    pinyinSwitch.checked = result.showPinyin !== false;
    translationSwitch.checked = siteOrigin ? (await getTranslationSites()).includes(siteOrigin) : false;
  } catch (e) {
    // 如果加载失败，使用默认值
    enableSwitch.checked = true;
    pinyinSwitch.checked = true;
    translationSwitch.checked = false;
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
      showStatus('保存失败，请重试');
    }
  });

  // 保存拼音显示设置
  pinyinSwitch.addEventListener('change', async (e) => {
    try {
      await chrome.storage.sync.set({ showPinyin: e.target.checked });
      showStatus('设置已保存');
    } catch (err) {
      showStatus('保存失败，请重试');
    }
  });

  // 保存当前网站的翻译授权
  translationSwitch.addEventListener('change', async (e) => {
    if (!siteOrigin) return;
    try {
      const sites = (await getTranslationSites()).filter((o) => o !== siteOrigin);
      if (e.target.checked) sites.push(siteOrigin);
      await chrome.storage.sync.set({ translationSites: sites });
      showStatus(e.target.checked ? '已在此网站开启翻译' : '已在此网站关闭翻译');
    } catch (err) {
      showStatus('保存失败，请重试');
    }
  });
});
