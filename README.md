<div align="center">
  <img src="icons/icon128.png" width="96" alt="Slop Off logo">

  # Slop Off

  **Edit any web page in place, then hand the diff straight to your AI assistant.**

  One click makes the page editable. A second click ships a clean
  before/after report of everything you changed — prefixed with a
  configurable prompt — straight to your coding agent via the bundled
  MCP bridge, with the full history kept in the extension.

  ![Manifest V3](https://img.shields.io/badge/Manifest-V3-195FA4)
  ![No dependencies](https://img.shields.io/badge/dependencies-none-16A37B)
  ![License: MIT](https://img.shields.io/badge/license-MIT-FBB734)
</div>

---

## Why?

Tweaking copy on a website through an AI coding assistant usually goes like
this: describe *where* the text is, describe *what* it should become, wait,
review, repeat. It's slow and error-prone.

Slop Off flips that around: **you make the edit directly on the page**,
and the extension produces an exact, machine-applicable changelog and hands
it to your assistant, which then knows precisely which HTML to find and
what to replace it with. No ambiguity, no back-and-forth.

## Features

- ✏️ **One-click edit mode** — the whole page becomes editable via
  `designMode`; a gold outline shows edit mode is on
- ⌨️ **Keyboard shortcut** — toggle edit mode with `Cmd+Shift+E`
  (`Ctrl+Shift+E` on Windows/Linux)
- 📋 **Before/after report** — one section per URL, one Before/After pair
  per changed element, wrapped in code fences, sent to your agent
- 🎯 **CSS selector per edit** — every edit includes a selector line so your
  assistant can pinpoint the element even when the same text appears twice
- 🤖 **Configurable AI prompt** — a prompt is prepended to the report so
  your assistant can apply it as-is; edit it (and the webhook URL) in the
  ⚙ overlay's Settings tab or on the settings page
- 🧭 **Survives navigation and reloads** — edits are synced to the background
  worker; navigate (full loads *and* SPA/pushState) or reload and keep editing
- 📝 **Form fields too** — changes to `<input>`, `<textarea>`, and `<select>`
  values are captured with the value baked into the HTML (incl. checkbox and
  radio state)
- 🖱 **Forms are editable too** — button labels and `<label>` text edit like
  any text (⌘/Ctrl-click a button to actually press it); typing in an empty
  field with a placeholder edits the placeholder itself; selects, checkboxes,
  details, and media controls stay interactive (⌥-click a `<summary>` to edit
  its text)
- 🔁 **Edits re-apply on return** — revisit a page you edited during the
  session and your changes are applied to it again and stay editable
- 🔗 **Safe links** — link clicks never navigate while editing; hovering a
  link shows an inline URL editor plus a ↗ button (or ⌘/Ctrl-click) to
  deliberately follow the link while the edit session continues
- ↩️ **Undo per edit** — a floating chip shows the live edit count; open it
  to undo edits on this page (↩︎) or drop edits from other pages (✕) without
  losing the rest — ending edit mode sends the report right away
- 👁 **Original / Diff / New views** — toggle the page between its original
  state, an in-page word diff (red strikethrough / green), and your edited
  version; Original and Diff behave like a normal read-only page, New
  returns to editing
- 💬 **Element annotations** — hold ⌃ to preview which element you'd pick,
  ⌃-click it and type an instruction in the terminal-style prompt (saved
  live); a small 💬 marker stays on the element — hover it to highlight the
  element and read the prompt, click it to edit, 🗑 to remove; Tab cycles
  through your annotations (Shift+Tab backwards) instead of the page's own
  tab order. Annotations land in the report as Element + Instruction pairs
  for your agent
- 🗂 **Report history** — the last 20 reports live in the History tab
  (same panel in the ⚙ overlay and on the settings page): view, copy,
  delete, or re-apply one to send it to the agent again
- 🧹 **Discard a session** — the ✕ next to the edits chip (or a fast
  double-Esc) reverts the page and throws the session away, with a
  confirmation when there are changes or notes; the report is still kept in
  history, marked as ignored
- ⚡ **Instant or batch** — the 📦/⚡ toggle next to the chip: batch
  (default) ships everything when you end the session; instant sends each
  change to the webhook as soon as you pause typing, so your agent starts
  right away — the preference is remembered, and if the webhook is down
  changes simply stay batched
- 📤 **Interim submit** — with changes pending, a send button appears next
  to the chip (or press ⌘⏎): ships everything now and the session keeps
  going with a fresh baseline
- 🪶 **Light or heavy model** — the feather/dumbbell toggle picks how much
  thinking your agent should spend: light for quick text tweaks (fast,
  cheap model), heavy when instructions need real reasoning; the choice
  rides along as a `model:` line in the report and a field in the webhook
  payload, and the `/slop-off` skill routes accordingly
- 🔔 **On-page toast** — a confirmation appears when the report is sent
- 💾 **Never loses a report** — every report (sent, failed, or discarded)
  stays in the history, ready to re-apply or copy manually
- 🤝 **MCP bridge** — POST reports to the bundled `mcp/server.js` and your
  coding agent picks them up via `wait_for_report`, queued and in order
- 🔁 **Two-way status** — a dot on the ⚙ button always shows whether the
  agent bridge is reachable (green/red/gray); after sending, a ⏳ pill in
  the HUD and the icon badge show how many reports still await the agent,
  and when the agent
  calls `notify_browser` a toast appears on the page with a 1-2 line
  summary of what was changed; click the pill to inspect queued reports
  or cancel one before the agent picks it up, and the ⚙ overlay has a
  Notifications tab (also reachable by clicking a toast) to read back the
  last 50 agent notifications
- ♻️ **Self-updating bridge** — the MCP server hot-reloads itself when its
  source changes (same process, same pipes), so a code update never needs
  a manual `/mcp` reconnect
- 🪶 **Zero dependencies** — small vanilla JS files, no build step

## Installation

This extension is not (yet) on the Chrome Web Store. Install it from source:

1. Clone this repository, or download the zip from the latest
   [release](../../releases) and unpack it
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the repository folder
5. *Optional:* click **Details** on the extension and enable
   **"Allow access to file URLs"** to use it on local `file://` pages

## Usage

1. **Click the extension icon** (or press `Cmd+Shift+E` / `Ctrl+Shift+E`).
   The page gets a gold outline, the badge shows **REC**, and all text is now
   directly editable.
2. **Edit the page.** Fix copy, rewrite headings, correct numbers, change
   form field values — anything. Navigating to other pages or reloading is
   fine; edit mode follows you.
3. **Click the icon again.** Edit mode turns off, the report is sent to
   your agent, and a toast confirms it with the edit count.
4. **Your assistant applies it.** The default prompt tells it to apply
   each edit to the source file, and its summary comes back as a toast.

### Example report

```
Apply the edits below to the source file referenced by the url.
For each Before/After pair: locate the Before HTML in the file and replace it with the After HTML.
For each Element/Instruction pair: locate the element in the source and carry out the instruction on it.
The selector line describes where the element lives in the rendered DOM, as a hint for finding it in the source.
Keep everything else unchanged and preserve the original formatting and indentation.

model: light

---

url: file:///Users/you/project/index.html

selector: body > main > div:nth-of-type(1)

Before:

​```
<div class='hero'>Welcome to our site</div>
​```

After:

​```
<div class='hero'>Welcome to WBSO.ai</div>
​```

selector: body > main > h1

Element:

​```
<h1>Our features</h1>
​```

Instruction: Make this headline punchier
```

### Settings

Right-click the extension icon → **Options** (or go via
`chrome://extensions` → Details → Extension options). There you can change
the prompt that is prepended to every report, or clear it to copy the bare
report. **Reset to default** restores the built-in prompt.

### Straight into your coding agent (MCP)

Reports flow directly into
Claude Code (or any MCP client) via the bundled bridge in `mcp/server.js` —
a single dependency-free Node script that receives reports from the
extension over HTTP and serves them to the agent as MCP tools.

#### 1. Register the MCP server

No clone needed — the bridge is published to npm and runs via `npx`:

```sh
claude mcp add --scope user slop-off -- npx -y slop-off
```

`--scope user` makes the tools available in every project. Verify with
`claude mcp list`; remove again with `claude mcp remove slop-off`.
The bridge listens on port `8931` (override with the `SLOP_OFF_PORT`
env var — then also adjust the webhook URL below).

> Prefer running from source? Point it at the checked-out script instead:
> `claude mcp add --scope user slop-off -- node "$(pwd)/mcp/server.js"`.

#### 2. Point the extension at it

Nothing to do — the extension defaults its **Webhook URL** to
`http://localhost:8931`, exactly where the bridge listens. Every report is
POSTed there and the on-page toast confirms it: *"Sent to agent"*. When no
Claude Code session (and thus no bridge) is running, a warning toast tells
you so and the report stays in the history, ready to re-apply later. Clear
the field in the settings to disable sending, or change it if you overrode
`SLOP_OFF_PORT`.

#### 3. Install the `/slop-off` skill

The skill ships in this repo at `.claude/skills/slop-off/SKILL.md`, so
inside this repo the slash command works as-is. To use it from any project,
install it user-wide with the [`skills`](https://skills.sh) CLI:

```sh
npx skills add wbso-ai/slop-off
```

That fetches the skill straight from GitHub and installs it into
`~/.claude/skills/` (pick **Claude Code** and the global scope when prompted;
or non-interactively: `npx skills add wbso-ai/slop-off -g -a claude-code -y`).
`skills` supports [70+ other agents](https://skills.sh) too — swap the
`-a` flag for Cursor, Codex, etc.

#### 4. Use it

In a Claude Code session in the project whose site you're editing:

- `/slop-off` — background loop: a cheap watcher subagent waits for reports
  while your main session stays free for other work. Per report you get two
  status lines (*📥 3 change(s) received* → *✅ 3 change(s) applied —
  files*), and the actual work is delegated to a subagent matching the
  report's `model:` line (light → Haiku, heavy → Opus). Say *stop* to end
  the loop
- `/slop-off once` — wait for and apply a single report
- `/slop-off latest` — apply the most recent report, without waiting
- `/slop-off list` — show the queue
- `/slop-off clear` — drop all pending reports from the queue

Reports queue up in order (`~/.slop-off/queue.json`, last 50), so
several edit sessions in a row are all delivered — `wait_for_report`
returns immediately while there's a backlog. Without the skill the raw MCP
tools (`wait_for_report`, `get_latest_report`, `list_reports`) work too:
*"wait for my edit report and apply it"*.

## How it works

| File | Role |
|---|---|
| `background.js` | Service worker: toggles edit mode, stores edits per tab in `chrome.storage.session`, re-injects the content script after navigation, builds the report and sends it to the webhook |
| `content.js` | Injected while edit mode is active: enables `designMode`, snapshots each element's `outerHTML` right before its first change (`beforeinput`), handles annotations/views/panel UI, and syncs edits + notes to the background (debounced) |
| `panes.js` | Shared UI panes (Shortcuts / Notifications / History / Settings): one implementation for the in-page ⚙ overlay and the options page |
| `options.html` / `options.js` | Settings page: thin shell around `panes.js` — stored in `chrome.storage.sync` / `.local` |
| `mcp/server.js` | Optional MCP bridge: HTTP endpoint for the webhook (+ `GET /status` for pending reports and agent notifications, `POST /cancel` to drop one) + `wait_for_report` / `get_latest_report` / `list_reports` / `clear_reports` / `notify_browser` tools over stdio; hot-reloads itself on code changes |
| `.claude/skills/slop-off/` | Claude Code skill: `/slop-off` processes queued reports in a loop |

Details worth knowing:

- The *before* snapshot is taken on the `beforeinput` event, so it captures
  the element exactly as it was prior to your first change.
- If a parent element is already tracked, its children are not tracked
  separately — this prevents nested duplicate entries in the report.
- Elements you focus but don't actually change are filtered out.
- Report sections are keyed by URL (ignoring the `#hash`): one section per
  page, no matter how often you visit it; revisiting re-applies your edits.

### Permissions

| Permission | Why |
|---|---|
| `scripting` + `<all_urls>` | Inject the content script, and re-inject it after navigation (this is what lets edit mode survive page changes) |
| `storage` | Persist your prompt (`sync`) and in-flight edits (`session`) |
| `activeTab` | Baseline access to the tab you clicked on |

The extension has no remote code and no analytics. The only network request
it makes is the report POST to your own webhook URL — by default
`http://localhost:8931`, i.e. the MCP bridge on your own machine. Clear the
field in the settings and your edits never leave the extension.

## Limitations

- Doesn't work on `chrome://` pages or the Chrome Web Store (the badge shows
  ✗). If you end edit mode on such a page, the report is still sent and
  kept in the history — only the toast can't be shown there.
- Heavily dynamic pages (e.g. React apps that re-render) may overwrite your
  edits or produce noisy diffs, since the framework owns the DOM. SPA
  navigations themselves are handled correctly.

## Development

No build step. Edit the files, then hit the reload icon on the extension card
in `chrome://extensions`. The icons are generated programmatically
(pure-Python PNG writer, no dependencies) — see `icons/`.

Contributions are welcome: open an issue or a pull request.

## License

[MIT](LICENSE) © 2026 Jankees van Woezik &lt;jankees@wbso.ai&gt;
