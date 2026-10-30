const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture() {
  const listeners = {};
  const timers = new Map();
  let timerId = 0;
  const state = {settings: {translationSites: ['https://example.invalid']}, requests: [], failStorage: false};
  const input = {value: '', type: 'text', tagName: 'INPUT', selectionStart: 0,
    addEventListener: (type, callback) => {listeners[type] = callback;},
    setRangeText(text, start) {this.value = this.value.slice(0, start) + text + this.value.slice(start);},
    dispatchEvent() {}};
  const context = vm.createContext({
    location: {origin: 'https://example.invalid'},
    chrome: {storage: {sync: {get: async () => {
      if (state.failStorage) throw new Error('unavailable');
      return {...state.settings};
    }}}},
    document: {readyState: 'complete', body: {}, querySelectorAll: () => [input]},
    MutationObserver: class {observe() {}}, Event: class {},
    setTimeout: callback => {timers.set(++timerId, callback); return timerId;},
    clearTimeout: id => timers.delete(id),
    window: {PinyinConverter: {getPinyin: () => 'ni hao'}, Translator: {translateText: async text => {
      state.requests.push(text);
      return state.translate ? state.translate() : 'Hello';
    }}}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../pinyin-extension/content.js'), 'utf8'), context);
  return {state, input, async type(value = '你好') {
    input.value = value; input.selectionStart = value.length;
    await listeners.input({data: value, inputType: 'insertText'});
    for (let i = 0; i < 4; i++) await Promise.resolve();
    assert.equal(timers.size, 1);
  }, compose() {listeners.compositionstart();}, async flush() {
    const pending = [...timers.values()]; timers.clear();
    for (const callback of pending) await callback();
  }};
}

for (const revoke of ['site', 'disabled', 'storage', 'sensitive']) {
  test(`queued translation does not send after ${revoke} changes`, async () => {
    const f = fixture();
    await f.type();
    if (revoke === 'site') f.state.settings.translationSites = [];
    if (revoke === 'disabled') f.state.settings.pinyinEnabled = false;
    if (revoke === 'storage') f.state.failStorage = true;
    if (revoke === 'sensitive') f.input.type = 'password';
    await f.flush();
    assert.deepEqual(f.state.requests, []);
  });
}

test('authorized translation still works with mocked transport', async () => {
  const f = fixture();
  await f.type(); await f.flush();
  assert.deepEqual(f.state.requests, ['你好']);
  assert.match(f.input.value, /\[Hello\]/);
});

test('same-length replacement cancels a queued translation', async () => {
  const f = fixture();
  await f.type(); f.input.value = '谢谢';
  await f.flush();
  assert.deepEqual(f.state.requests, []);
});

test('starting a new IME composition cancels queued input', async () => {
  const f = fixture();
  await f.type(); f.compose(); await f.flush();
  assert.deepEqual(f.state.requests, []);
  assert.equal(f.input.value, '你好');
});

test('translation response is discarded after input or authorization changes', async () => {
  for (const change of ['input', 'authorization']) {
    const f = fixture(); let finish;
    f.state.translate = () => new Promise(resolve => {finish = resolve;});
    await f.type();
    const pending = f.flush();
    for (let i = 0; i < 20 && !finish; i++) await Promise.resolve();
    assert.equal(typeof finish, 'function');
    if (change === 'input') f.input.value = '谢谢';
    else f.state.settings.translationSites = [];
    finish('Hello'); await pending;
    assert.equal(f.input.value, change === 'input' ? '谢谢' : '你好');
  }
});

// Issue #3: a site revoked inside the debounce window must not get one last
// request, while the local pinyin supplement keeps working.
test('revoking the site inside the debounce window sends nothing but keeps pinyin', async () => {
  const f = fixture();
  await f.type();
  f.state.settings.translationSites = [];
  await f.flush();
  assert.deepEqual(f.state.requests, []);
  assert.equal(f.input.value, '你好 (ni hao)');
});
