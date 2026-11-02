# Regex Replay

A regex debugger that **replays the match**. Type a pattern and a test string, then step through every decision a backtracking regex engine makes: each character test, each branch it tries, and each time it rewinds. It shows *why* a pattern like `^(a+)+$` freezes on `aaaaaaaaaaaaaaaaaaaaaaaab`.

## Features

- **Hand-written regex engine.** A parser and backtracking matcher written from scratch (no `RegExp` under the hood). It follows JavaScript's matching rules and records every decision as a replayable frame.
- **Step-by-step replay.** Play, pause, scrub, and jump straight to the next or previous backtrack. The current pattern piece and input position are highlighted, with a plain-English narration of each step.
- **Timeline.** A graph of input position across every step. Catastrophic backtracking shows up as a dense sawtooth. Click or drag to jump.
- **Heat map.** The pattern and the structure tree show how many times the engine tried each piece, so hot spots stand out.
- **Growth probe.** Repeats a piece of text 1, 2, 3… times and classifies how the work grows: linear, quadratic, polynomial or exponential. For exponential growth it projects the step count at 30 repetitions.
- **Verified against the browser.** Every run is compared with the browser's built-in `RegExp`, both match spans and captures.
- **Captures panel.** Shows the value of each group at the current step, including JavaScript's rule that captures reset on each repetition.
- Dark theme shared with [blazexyz.com](https://blazexyz.com), works at phone width, keyboard shortcuts (`Space`, `←` `→`, `Shift`+arrows, `Home`/`End`).

## Supported syntax

Literals and escapes (`\n \t \xHH \uHHHH`), `.`, character classes (`[^a-z\d]`), `\d \w \s` and their negations, anchors `^ $ \b \B`, capturing / non-capturing / named groups, alternation, greedy and lazy quantifiers (`* + ? {n} {n,} {n,m}`), lookahead `(?=…)` `(?!…)`, and backreferences `\1` `\k<name>`. Flags: `g i m s`.

Not supported yet: lookbehind, Unicode mode (`u`/`v`), sticky (`y`).

## Running it

It's one self-contained file with no build step or dependencies. Open `index.html` in a browser, or serve the folder with any static server.

To host it on **GitHub Pages**, go to *Settings → Pages* in the repo, choose *Deploy from a branch*, and pick `main` / `(root)`. The site appears at `https://<your-username>.github.io/regex-replay/`.

Add a hash to open an example directly, e.g. `index.html#catastrophic`.

Examples: `greedy`, `lazy`, `catastrophic`, `fixed`, `alternation`, `trailing`, `email`, `words`, `password`, `dates`.

## Tests

```bash
npm test
```

No install needed: the tests use only Node (18 or newer). They also run on every push through GitHub Actions. The test script pulls the engine out of `index.html` and checks it against Node's `RegExp` on 35 hand-picked cases, 10 syntax-error cases, and 4,000 randomly generated pattern/input pairs.

## How the engine works

The parser turns the pattern into a tree of nodes (`char`, `class`, `seq`, `alt`, `quant`, `group`, `look`, `backref`, anchors), and each node remembers its span in the source so the UI can highlight it. The matcher uses continuation-passing style: each node is matched with a callback for "the rest of the pattern". If the callback fails, control returns to the node, which tries its next option. That return is a backtrack. Every test, branch, repetition, capture and backtrack is emitted as a frame `{kind, node, position, captures, depth}`. Capture arrays are copied only when a group closes, so each frame can keep a reference to them cheaply. Recorded runs stop at 200,000 frames, so a catastrophic pattern can't hang the tab.

## License

MIT
