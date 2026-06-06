# 🧩 Browser Extensions

> Small, focused Chrome/Edge extensions for Chinese learning and turning books into NotebookLM-ready chapters.

**English | [中文](#中文)**

![Last commit](https://img.shields.io/github/last-commit/shengdabai/browser-extensions)
![Stars](https://img.shields.io/github/stars/shengdabai/browser-extensions?style=social)
![Follow](https://img.shields.io/github/followers/shengdabai?style=social)

A monorepo of three lightweight, single-purpose browser extensions — built by a Chinese teacher (6000+ students) who keeps shipping the small tools he actually needs in the classroom and reading workflow. No build step, no tracking, no accounts. Just load and use.

## Why

Two recurring frustrations drove these:

1. **Big books don't fit NotebookLM well.** Drop a 400-page PDF in and analysis gets shallow. Split it into chapters and each one gets real attention.
2. **Learners can't read raw Chinese yet.** They need pinyin and a quick translation *in place*, not in a separate tab.

So instead of one bloated extension, this repo keeps each tool tiny and sharp.

## What's inside

All three are **Manifest V3**, written in plain JavaScript, with their libraries vendored locally (no CDN required at runtime).

## ✨ Extensions

| Extension | What it does | Folder |
|-----------|--------------|--------|
| 📚 **Book Splitter** | Splits PDF / EPUB / MOBI books into per-chapter files for deeper NotebookLM analysis. Auto chapter detection (numeric, Chinese, Roman, custom regex) and exports to **txt / Markdown / HTML**. | [`book-splitter-extension/`](book-splitter-extension/) |
| 📝 **NotebookLM Chapter Splitter** | A NotebookLM-tuned splitter with a polished UI and **4 split modes** (auto / by length / by paragraph / smart). Detects chapters, previews them, then batch-downloads. | [`notebooklm-chapter-splitter/`](notebooklm-chapter-splitter/) |
| 🇨🇳 Pinyin & Translation Assistant | As a learner types Chinese on *any* page, it appends tone-marked pinyin and an English gloss inline — `你好 (nǐ hǎo) [Hello]`. Toggle pinyin / translation independently. | [`pinyin-extension/`](pinyin-extension/) |

> Two splitters? **Book Splitter** is the stable, multi-format-output classic; **NotebookLM Chapter Splitter** is the newer, prettier, NotebookLM-optimized one. They don't conflict — install either or both.

## 🧱 Tech stack

- **Manifest V3** Chrome/Edge extensions, vanilla JavaScript — no framework, no bundler
- **[PDF.js](https://mozilla.github.io/pdf.js/)** for PDF text extraction (vendored in `libs/`)
- **[JSZip](https://stuk.github.io/jszip/)** for EPUB unpacking (vendored in `libs/`)
- **[pinyin-pro](https://github.com/zh-lx/pinyin-pro)** for accurate tone-marked pinyin (vendored in `lib/`)
- **Google Translate** free endpoint for the inline English gloss

## 🚀 Install (load unpacked)

There's nothing to build. Per extension:

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the extension's folder:
   - `book-splitter-extension/`
   - `notebooklm-chapter-splitter/`
   - `pinyin-extension/`

Repeat for each one you want. Tested on Chrome 88+ / Edge 88+.

## 📖 Usage

- **Book Splitter** — click the toolbar icon → *Choose book file* → pick a chapter-detection mode and output format (txt/md/html) → *Start splitting* → *Download all chapters*. A floating "📚 Split book" button also appears on NotebookLM pages.
- **NotebookLM Chapter Splitter** — click the icon → choose a file → review the auto-detected chapter preview → pick a split mode → *Start splitting* (chapters download automatically). Then import the chapter files into [NotebookLM](https://notebooklm.google.com).
- **Pinyin Assistant** — enabled by default after install. Type Chinese in any input/textarea/contenteditable and the annotation appears inline. Click the icon to toggle pinyin and/or translation.

## 🗺️ Status

Actively maintained, used daily in real teaching. Current versions: Book Splitter `1.1.0`, NotebookLM Chapter Splitter `1.1.0`, Pinyin Assistant `2.0.0`. Not yet on the Chrome Web Store — load unpacked for now. Issues and PRs welcome.

## 🤝 Connect / About

Built in public by **Tony (Sheng)** — a Chinese-language teacher with 6000+ students, building AI + Chinese-teaching tools out loud.

If any of these save you time, please **⭐ Star this repo and [Follow @shengdabai](https://github.com/shengdabai)** — it genuinely helps and keeps the small tools coming.

Sibling projects you might like:
- **freespace** — reclaim disk space, the calm way
- **teaching-notes-sidebar** — a sidebar for teaching notes while you browse
- **insidebar-ai** — AI assistance, right in your browser sidebar

**License:** MIT (see each extension's own notes).

---

# 中文

> 小而专的 Chrome/Edge 扩展合集：服务中文学习，以及把书拆成适合 NotebookLM 的章节。

**[English](#-browser-extensions) | 中文**

一个收纳了三个轻量、单一职责浏览器扩展的 monorepo —— 作者是一位有 6000+ 学员的中文老师，把课堂和阅读中真正用得上的小工具持续公开打磨出来。无需构建、无追踪、无需账号，加载即用。

## 为什么做

两个反复出现的痛点:

1. **大部头喂给 NotebookLM 效果差。** 直接丢一本 400 页 PDF，分析会很浅；拆成章节后，每章都能被认真对待。
2. **初学者还读不了纯中文。** 他们需要拼音和快速翻译**就地**显示，而不是另开标签页查。

所以这里没有做一个臃肿的大插件，而是让每个工具都保持小而锋利。

## 包含内容

三者均为 **Manifest V3**，纯 JavaScript 编写，依赖库全部本地内置（运行时不依赖 CDN）。

## ✨ 扩展一览

| 扩展 | 功能 | 目录 |
|------|------|------|
| 📚 **书籍章节拆分** | 将 PDF / EPUB / MOBI 按章节拆成独立文件，便于 NotebookLM 更深入分析。自动识别章节（数字 / 中文 / 罗马数字 / 自定义正则），可导出 **txt / Markdown / HTML**。 | [`book-splitter-extension/`](book-splitter-extension/) |
| 📝 **NotebookLM 章节拆分** | 针对 NotebookLM 优化、界面更精美的拆分工具，提供**四种拆分模式**（自动 / 按长度 / 按段落 / 智能）。检测章节、预览、批量下载。 | [`notebooklm-chapter-splitter/`](notebooklm-chapter-splitter/) |
| 🇨🇳 拼音与翻译助手 | 在**任意网页**输入中文时，自动在后面追加带声调拼音和英文释义 —— `你好 (nǐ hǎo) [Hello]`。拼音与翻译可分别开关。 | [`pinyin-extension/`](pinyin-extension/) |

> 为什么有两个拆分器？**书籍章节拆分**是稳定、多输出格式的经典款；**NotebookLM 章节拆分**是更新、更好看、针对 NotebookLM 优化的版本。互不冲突，装一个或两个都行。

## 🧱 技术栈

- **Manifest V3** Chrome/Edge 扩展，纯 JavaScript —— 无框架、无打包器
- **[PDF.js](https://mozilla.github.io/pdf.js/)** 解析 PDF 文本（内置于 `libs/`）
- **[JSZip](https://stuk.github.io/jszip/)** 解压 EPUB（内置于 `libs/`）
- **[pinyin-pro](https://github.com/zh-lx/pinyin-pro)** 生成准确的带声调拼音（内置于 `lib/`）
- **Google 翻译** 免费接口提供英文释义

## 🚀 安装（加载已解压扩展）

无需构建。对每个扩展:

1. 打开 `chrome://extensions/`（或 `edge://extensions/`）
2. 开启右上角的**开发者模式**
3. 点击**加载已解压的扩展程序**
4. 选择对应文件夹:
   - `book-splitter-extension/`
   - `notebooklm-chapter-splitter/`
   - `pinyin-extension/`

需要哪个就装哪个。已在 Chrome 88+ / Edge 88+ 测试。

## 📖 使用

- **书籍章节拆分** —— 点击工具栏图标 → *选择书籍文件* → 选择章节识别模式与输出格式（txt/md/html）→ *开始拆分* → *下载所有章节*。在 NotebookLM 页面右下角还会出现“📚 拆分书籍”浮动按钮。
- **NotebookLM 章节拆分** —— 点击图标 → 选择文件 → 查看自动检测的章节预览 → 选择拆分模式 → *开始拆分*（章节自动下载）。随后把章节文件导入 [NotebookLM](https://notebooklm.google.com)。
- **拼音助手** —— 安装后默认启用。在任意输入框/文本域/可编辑区输入中文，标注就地出现。点击图标可分别开关拼音与翻译。

## 🗺️ 状态

持续维护，每天用于真实教学。当前版本:书籍章节拆分 `1.1.0`、NotebookLM 章节拆分 `1.1.0`、拼音助手 `2.0.0`。暂未上架 Chrome 应用商店，目前以加载已解压方式使用。欢迎提 Issue 和 PR。

## 🤝 联系 / 关于

由 **Tony (Sheng)** 公开打造 —— 一位拥有 6000+ 学员的中文老师，正在“边做边晒”地构建 AI + 中文教学工具。

如果这些工具帮你省了时间，欢迎 **⭐ Star 本仓库并 [关注 @shengdabai](https://github.com/shengdabai)** —— 这对我很有帮助，也会让更多小工具持续产出。

你可能也会喜欢的姊妹项目:
- **freespace** —— 从容地回收磁盘空间
- **teaching-notes-sidebar** —— 浏览时随手记教学笔记的侧边栏
- **insidebar-ai** —— 浏览器侧边栏里的 AI 助手

**许可证:** MIT（详见各扩展自身说明）。
