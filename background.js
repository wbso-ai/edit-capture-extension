const DEFAULT_PROMPT = [
  'Apply the edits below to the source file referenced by the url.',
  'For each Before/After pair: locate the Before HTML in the file and replace it with the After HTML.',
  'Keep everything else unchanged and preserve the original formatting and indentation.',
].join('\n');

const activeKey = (tabId) => `active_${tabId}`;
const sectionsKey = (tabId) => `sections_${tabId}`;

async function isActive(tabId) {
  const data = await chrome.storage.session.get(activeKey(tabId));
  return Boolean(data[activeKey(tabId)]);
}

async function getSections(tabId) {
  const data = await chrome.storage.session.get(sectionsKey(tabId));
  return data[sectionsKey(tabId)] || [];
}

// Insert or replace the edits for one page visit.
function upsertSection(sections, { visitId, url, edits }) {
  const i = sections.findIndex((s) => s.visitId === visitId);
  if (i >= 0) sections[i] = { visitId, url, edits };
  else sections.push({ visitId, url, edits });
}

function buildReport(promptPrefix, sections, fallbackUrl) {
  const parts = [];
  if (promptPrefix && promptPrefix.trim()) {
    parts.push(promptPrefix.trim(), '');
  }

  const withEdits = sections.filter((s) => s.edits.length > 0);
  if (withEdits.length === 0) {
    parts.push('---', '', `url: ${fallbackUrl}`, '', '(no changes detected)');
  }
  for (const section of withEdits) {
    parts.push('---', '', `url: ${section.url}`);
    for (const { before, after } of section.edits) {
      parts.push(
        '',
        'Before:',
        '',
        '```',
        before,
        '```',
        '',
        'After:',
        '',
        '```',
        after,
        '```'
      );
    }
    parts.push('');
  }
  return parts.join('\n').trimEnd() + '\n';
}

// Runs in the page: copy the report to the clipboard.
function copyReport(report) {
  const copyViaTextarea = () => {
    const ta = document.createElement('textarea');
    ta.value = report;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  };
  return navigator.clipboard
    .writeText(report)
    .then(() => true)
    .catch(() => copyViaTextarea());
}

async function setBadge(tabId, text, color) {
  if (color) await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  const tabId = tab.id;

  if (!(await isActive(tabId))) {
    // ── Edit mode ON ───────────────────────────────────────────────
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    } catch (e) {
      // Pages that disallow injection (chrome://, web store, etc.)
      await setBadge(tabId, '✗', '#C2410C');
      return;
    }
    await chrome.storage.session.set({
      [activeKey(tabId)]: true,
      [sectionsKey(tabId)]: [],
    });
    await setBadge(tabId, 'ON', '#FBB734');
    return;
  }

  // ── Edit mode OFF: collect, build report, copy ───────────────────
  let finalPage = null;
  try {
    finalPage = await chrome.tabs.sendMessage(tabId, { type: 'finalize' });
  } catch (e) {
    // No content script on the current page (injection failed there).
  }

  const sections = await getSections(tabId);
  if (finalPage) upsertSection(sections, finalPage);

  await chrome.storage.session.remove([activeKey(tabId), sectionsKey(tabId)]);

  const { prompt } = await chrome.storage.sync.get({ prompt: DEFAULT_PROMPT });
  const report = buildReport(prompt, sections, tab.url || '');
  const editCount = sections.reduce((n, s) => n + s.edits.length, 0);

  let copied = false;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: copyReport,
      args: [report],
    });
    copied = Boolean(result);
  } catch (e) {
    copied = false;
  }

  await setBadge(tabId, copied ? `${editCount}` : '✗', copied ? '#195FA4' : '#C2410C');
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: '' }), 2500);
});

// Keep edit mode alive across navigations and reloads: re-inject the content
// script whenever an active tab finishes loading a page.
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info.status !== 'complete') return;
  if (!(await isActive(tabId))) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await setBadge(tabId, 'ON', '#FBB734');
  } catch (e) {
    // Landed on a page that disallows injection; edits so far are kept.
  }
});

// Receive (debounced) edit snapshots from the content script.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'sync' || !sender.tab?.id) return;
  const tabId = sender.tab.id;
  (async () => {
    if (!(await isActive(tabId))) return;
    const sections = await getSections(tabId);
    upsertSection(sections, msg);
    await chrome.storage.session.set({ [sectionsKey(tabId)]: sections });
  })();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove([activeKey(tabId), sectionsKey(tabId)]);
});
