// Injected while edit mode is active. Re-injected after each full navigation
// by the background service worker; SPA navigations (pushState) are detected
// here. Collected edits are synced to the background so they survive page
// changes.
(() => {
  if (window.__editCaptureInjected) {
    window.__editCaptureEnable();
    return;
  }
  window.__editCaptureInjected = true;

  const newVisitId = () => `${Math.random().toString(36).slice(2)}-${Date.now()}`;

  let active = false;
  let visitId = newVisitId(); // one id per page visit, for upserts in the background
  let currentUrl = location.href;
  let tracked = new Map(); // element -> { before, after }
  let syncTimer = null;
  let urlWatch = null;

  // Keep the "after" snapshot current while elements are still in the DOM.
  // SPA frameworks (Next.js, React) replace the DOM on navigation, so by the
  // time we notice the URL changed, the elements are already disconnected —
  // this preserves the user's last edit instead of reporting a removal.
  const updateAfters = () => {
    for (const [el, rec] of tracked) {
      if (el.isConnected) rec.after = el.outerHTML;
    }
  };

  const snapshot = () => {
    const edits = [];
    for (const rec of tracked.values()) {
      const after = rec.after != null ? rec.after : '(element removed)';
      if (after !== rec.before) edits.push({ before: rec.before, after });
    }
    return edits;
  };

  const sync = () => {
    try {
      chrome.runtime.sendMessage({
        type: 'sync',
        visitId,
        url: currentUrl,
        edits: snapshot(),
      });
    } catch (e) {
      // Extension context gone (e.g. reloaded); nothing we can do.
    }
  };

  // SPA navigation: close out the previous visit and start a fresh one.
  const checkUrlChange = () => {
    if (location.href === currentUrl) return;
    clearTimeout(syncTimer);
    sync();
    visitId = newVisitId();
    currentUrl = location.href;
    tracked = new Map();
  };

  const onBeforeInput = () => {
    checkUrlChange();
    const sel = document.getSelection();
    const node = sel && sel.anchorNode;
    if (!node) return;

    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el || el === document.body || el === document.documentElement) return;

    // Skip if already covered by a tracked (ancestor) element,
    // otherwise the report gets nested duplicate entries.
    for (const trackedEl of tracked.keys()) {
      if (trackedEl === el || trackedEl.contains(el)) return;
    }
    tracked.set(el, { before: el.outerHTML, after: null });
  };

  const onInput = () => {
    checkUrlChange();
    updateAfters();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sync, 300);
  };

  const onPageHide = () => {
    checkUrlChange();
    sync();
  };

  const enable = () => {
    if (active) return;
    active = true;
    document.addEventListener('beforeinput', onBeforeInput, true);
    document.addEventListener('input', onInput, true);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('popstate', checkUrlChange);
    urlWatch = setInterval(checkUrlChange, 400);
    document.designMode = 'on';
    document.documentElement.style.setProperty('outline', '4px solid #FBB734', 'important');
    document.documentElement.style.setProperty('outline-offset', '-4px', 'important');
  };

  const disable = () => {
    if (!active) return;
    active = false;
    clearTimeout(syncTimer);
    clearInterval(urlWatch);
    document.removeEventListener('beforeinput', onBeforeInput, true);
    document.removeEventListener('input', onInput, true);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('popstate', checkUrlChange);
    document.designMode = 'off';
    document.documentElement.style.removeProperty('outline');
    document.documentElement.style.removeProperty('outline-offset');
    tracked = new Map();
  };

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'finalize') {
      // Don't checkUrlChange() here: its fire-and-forget sync could race the
      // background's section read. `tracked` always belongs to `currentUrl`,
      // so responding with it directly is both safe and correct.
      updateAfters();
      sendResponse({ visitId, url: currentUrl, edits: snapshot() });
      disable();
    }
  });

  window.__editCaptureEnable = enable;
  enable();
})();
