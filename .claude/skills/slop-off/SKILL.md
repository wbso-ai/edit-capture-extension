---
name: slop-off
description: >
  Process Slop Off browser reports via the slop-off MCP server and
  apply the edits to the current project's source. By default keeps
  looping over reports until the user stops. Use for
  "/slop-off", "apply my edit report", "wait for my browser edits",
  or after the user has made edits in the browser with the
  Slop Off extension.
---

# Apply browser edits

Process reports from the `slop-off` MCP server and apply them to the source.

## Mode

- **Default (background loop)**: the waiting happens in a background
  subagent so this main session stays free for other work.
  1. Spawn a **watcher** via the Agent tool: `model: "haiku"`,
     `run_in_background: true`, prompt: *"Call the slop-off MCP tool
     `wait_for_report` with timeout_seconds: 60. If it responds with 'No
     report arrived', call it again, up to 5 times. Return as your final
     answer only the full report text, or exactly NO_REPORT if nothing
     came."*
  2. Report once: "I'm waiting in the background for browser edits — say
     'stop' when you're done" and continue with whatever the user is doing
     (or hand the turn back).
  3. Once the watcher finishes you're notified. Report received →
     first report in a single line "📥 N change(s) received" (N = the number
     of edits from the report header), then process it (see "Model" below)
     and immediately spawn a new watcher afterwards. NO_REPORT → just spawn
     a new watcher, without comment — empty watchers are normal, the loop
     runs until the user says stop. After ~6 empty watchers in a row,
     mention in one line that you're still waiting (don't ask, don't stop);
     repeat that at most once an hour.
  4. If the user says "stop" (or "done"), don't spawn a new watcher
     anymore.
- Argument `once`: process exactly one report (may be synchronous with
  `wait_for_report`) and stop.
- Argument `latest`: call `get_latest_report` (don't wait), process,
  stop.
- Argument `list`: call `list_reports`, show the queue, ask which one.
- Argument `clear`: call `clear_reports` and report in a single line how many
  reports were cleared. Process nothing, then stop.

## Model (light or heavy) — delegation required

You are the orchestrator and do NOT process reports yourself. Spawn a subagent
per report via the Agent tool with the model the report asks for (the
`model:` line in the report / the MCP header):

- **`model: light`** (or no line) → `Agent` with `model: "haiku"`
- **`model: heavy`** → `Agent` with `model: "opus"`

Give the worker subagent in its prompt: the full report, the project's
working path, and the full "Apply edits" instructions below. Have it report
which files were changed and which edits were not applicable. Then report to
the user in a single line: "✅ N change(s) applied — file1, file2". Only if
something failed a second line: "⚠️ not applicable: …". No further explanation.
Then ALWAYS call the slop-off MCP tool `notify_browser` with that same
summary (max 2 short lines) — success or failure. The extension shows it as
a toast on the page, and the call also marks the report as done in the
browser HUD: skip it and the report stays stuck on "applying" for the user.
Run the worker synchronously (`run_in_background: false`) so reports are
processed in order and workers don't touch each other's files — the long wait
already happens in the background watcher, so this only blocks during the
actual applying.

Only if the Agent tool is unavailable do you process the report yourself.

## Apply edits

The report contains per-URL sections with Before/After HTML pairs and/or
Element/Instruction pairs, each with a CSS selector as a hint.

1. For each edit find the source file that renders that page/HTML: search for
   distinctive text from the Before block (literal strings first,
   then fuzzy). The URL says which route/page; the selector where in the DOM.
2. Replace the Before content with the After content. Preserve existing
   formatting, indentation and templating (translate HTML changes into the
   template/JSX/component if the source isn't plain HTML).
3. Not found? Report it explicitly with the closest match — never
   silently guess or skip. Then just continue the loop.
4. Placeholder, href and other attribute changes are attribute edits;
   change only that attribute.
5. Element/Instruction pairs are annotations: find the element (selector +
   Element snippet) and carry out the instruction on that element in the source.
   These are free-form tasks ("make this shorter", "different color") — carry
   them out to the best of your judgment and report what you did.

## Per processed report

- Run a quick check if the project has one (typecheck/lint; no
  full build per report in loop mode).
- Summarize in 1-3 lines: which files, which edits, what failed.
- Always call `notify_browser` with a 1-2 line summary of what changed
  (e.g. "Hero heading and CTA text updated in index.html") — also on
  failure; it completes the report in the browser HUD.
- Go straight back to waiting.
