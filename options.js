const DEFAULT_PROMPT = [
  'Apply the edits below to the source file referenced by the url.',
  'For each Before/After pair: locate the Before HTML in the file and replace it with the After HTML.',
  'The selector line describes where the element lives in the rendered DOM, as a hint for finding it in the source.',
  'Keep everything else unchanged and preserve the original formatting and indentation.',
].join('\n');

const promptEl = document.getElementById('prompt');
const statusEl = document.getElementById('status');

function flash(message) {
  statusEl.textContent = message;
  setTimeout(() => (statusEl.textContent = ''), 2000);
}

chrome.storage.sync.get({ prompt: DEFAULT_PROMPT }, ({ prompt }) => {
  promptEl.value = prompt;
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set({ prompt: promptEl.value }, () => flash('Saved ✓'));
});

document.getElementById('reset').addEventListener('click', () => {
  promptEl.value = DEFAULT_PROMPT;
  chrome.storage.sync.set({ prompt: DEFAULT_PROMPT }, () => flash('Reset ✓'));
});
