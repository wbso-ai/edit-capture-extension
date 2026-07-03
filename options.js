// Options page: thin glue around the shared panes (panes.js) — the exact
// same tabs as the in-page ⚙ overlay.
const P = window.SlopOffPanes;

// Re-apply here POSTs straight to the webhook (no background needed).
const resend = (item, cb) => {
  chrome.storage.sync.get({ webhookUrl: 'http://localhost:8931' }, ({ webhookUrl }) => {
    const url = webhookUrl.trim();
    if (!url) return cb(false);
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ report: item.report, count: item.count, model: null, urls: item.urls || [] }),
    })
      .then((r) => cb(r.ok))
      .catch(() => cb(false));
  });
};

const api = P.mountTabs(
  document.getElementById('tabbar'),
  document.getElementById('panes'),
  [
    { key: 'settings', label: 'Settings', fill: (el) => P.renderSettings(el) },
    { key: 'notes', label: 'Notifications', fill: (el) => P.renderNotifications(el) },
    { key: 'history', label: 'History', fill: (el) => P.renderHistory(el, { resend }) },
    { key: 'keys', label: 'Shortcuts', fill: P.renderShortcuts },
  ],
  location.hash.slice(1) || 'settings' // e.g. options.html#notes from a clicked toast
);

// Live refresh: notifications/history arriving while this tab is open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if ((changes.notifications || changes.history) && api.getTab() !== 'settings') api.refresh();
});
