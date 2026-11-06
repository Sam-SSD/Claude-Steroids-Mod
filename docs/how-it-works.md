# How it works

```
 Claude Code ──► Steroids (this repo) ──► OmniRoute (local gateway, :20128) ──► your providers
 (opus/sonnet/haiku)   switch + badge        priority chains + lossless compression   Claude · Gemini · Copilot · ...
```

Claude Code speaks the Anthropic API. OmniRoute exposes the same API on `localhost`, so Claude Code only needs three environment variables to talk to it. Steroids automates flipping those variables, builds the model chains, and keeps you aware of the state.

## The pieces

| Piece | File | Job |
|---|---|---|
| The mod | `hooks/register.tsx` | Registers `/steroids`, draws the badge, adds the plugin reminder to the system prompt, starts the gateway at session start if the config points at it |
| The switch | `setup/toggle.js` (copied to `~/.claude/steroids/`) | `on`, `off`, `ensure`. The only thing that edits `settings.json` |
| The installer | `setup/setup.mjs` | `install`, `combos`, `compression on|off` |
| The config | `~/.claude/steroids/steroids.json` | Gateway URL, API key, the three model aliases, your plugins, your chains. Never committed |

## What `/steroids on` does

1. Starts OmniRoute if it is not running (`omniroute serve --daemon`).
2. **Tests the whole path** with a real 5-token request through the gateway using your key. If that fails, it stops and leaves your configuration untouched.
3. Backs up `settings.json` (`settings.json.bak-steroids`) and writes:
   - `ANTHROPIC_BASE_URL` → the gateway
   - `ANTHROPIC_AUTH_TOKEN` → your gateway key
   - `ANTHROPIC_DEFAULT_OPUS_MODEL`, `..._SONNET_MODEL`, `..._HAIKU_MODEL` → `steroids-opus[1m]`, `steroids-sonnet[1m]`, `steroids-haiku[1m]`
4. Marks the plugins listed in `plugins` as enabled.

`/steroids off` removes those variables and stops the gateway. Claude Code reads the environment when a session starts, which is why **only new sessions change**.

## The badge

The mod compares two values: what **this session** started with (the live `ANTHROPIC_BASE_URL`) and what **settings.json** says now. Equal → `💪 Steroids` or `⚪ Normal`. Different → `🟡 Steroids on: restart` (you switched, this session has not caught up). It is drawn through the `SessionMode` footer, at the right of `? for shortcuts`, on terminal and desktop surfaces.

## The chains

A *combo* is an OmniRoute routing rule. Steroids creates three, each with the `priority` strategy: try the first model, and if it fails try the next.

```
steroids-opus   : claude-opus-5-5   → another provider's Claude → Gemini → Copilot auto → gpt-4.1
steroids-sonnet : claude-sonnet-5-5 → …
steroids-haiku  : claude-haiku-5-5  → …
```

The exact models are yours to set in `chains`; the example in `setup/steroids.example.json` is the one I use. Model ids differ per account: run `omniroute models`.

## The compression preset

`setup.mjs compression on` enables only techniques that do not rewrite meaning:

| Engine | What it does | On |
|---|---|---|
| `session-dedup` | drops content repeated across turns | yes |
| `lite` | whitespace trimming | yes |
| `rtk` (standard) | command-aware filtering of tool output | yes |
| `headroom` | lossless tabular compaction of JSON arrays | yes |
| `caveman`, `aggressive`, `llmlingua`, `ultra`, `ccr`, `omniglyph` | summarising, pruning or archiving | **off** |

Only the JSON/tabular engine produced savings in my tests; see [benchmarks.md](benchmarks.md). Your previous OmniRoute setting is saved to `~/.claude/steroids/compression-original.json` and `compression off` restores it.

## The reminder and the rules

At the end of the system prompt the mod adds a short block telling the model to use ponytail on code, `frontend-design` on UI and to search MemPalace before answering about past work. It is a nudge, not a guarantee: the model can ignore it. The optional `CLAUDE.md` block says the same with more weight, and adds the no-`Co-Authored-By` rule.

## Why not a separate compression proxy?

I tried running the standalone Headroom proxy in front of OmniRoute. It reached the same savings on JSON, none on logs or `ls` and at most about 2 % on a code file, at the cost of another process, another port and another point of failure. OmniRoute's own engine did the same job, so Steroids does not ship one.
