<div align="center">

![Claude Steroids](assets/banner.png)

# Claude Steroids 💪

**Claude Code that never runs out of breath.**
One command puts a local gateway between Claude Code and your models: automatic fallback when a provider runs out, lossless compression of big tool results, one model chain per role, and a badge that tells you which mode you are in.

[English](README.md) · [Español](README.es.md)

![license](https://img.shields.io/badge/license-MIT-FFD60A) ![node](https://img.shields.io/badge/node-%E2%89%A522.22.2-D97757) ![status](https://img.shields.io/badge/tested%20on-Windows%2010-6b7280)

</div>

> **Unofficial fan project.** Not affiliated with, endorsed by or sponsored by Anthropic. "Claude" and "Claude Code" are Anthropic's trademarks. The mascot is an original pixel-art drawing inspired by Claude Code's orange character.

---

## What is this?

Claude Steroids is a **Claude Code mod** (a function-hooks plugin) plus a small setup script and a recommended configuration. It does four things:

1. **`/steroids on|off|status`** switches new Claude Code sessions to run through [OmniRoute](https://github.com/diegosouzapw/OmniRoute), a local gateway, and back.
2. **Fallback chains.** Each of Claude Code's three model aliases (`opus`, `sonnet`, `haiku`) points to its own chain of models: your Claude plan first, then the next provider you connected, and so on.
3. **Lossless compression** of large structured tool results (JSON, tables) before they are billed as tokens.
4. **Good habits baked in:** a badge in the prompt footer, a reminder to use your plugins, and an optional rule so commits never carry a `Co-Authored-By` line.

It does **not** make Claude smarter. It makes your setup harder to stop and a bit cheaper on structured data.

## Normal Claude Code vs. with Steroids

| | Normal Claude Code | With Steroids |
|---|---|---|
| Your Claude limit is reached | You wait for the reset | The request moves to the next model in your chain *(each link verified; a real quota exhaustion has not yet been observed, see [Limitations](#limitations-and-honesty))* |
| Several terminals with different roles | One model at a time, switched by hand | `opus` / `sonnet` / `haiku` each map to their own chain, so a leader + builders layout just works |
| 600-row JSON returned by a tool | Billed in full | **−47 %** input tokens, data intact ([measured](#measured-results)) |
| `git log` and `ls` output | Billed in full | Billed in full (**~0 %**, I measured it) |
| Which mode am I in? | Open `settings.json` | Badge `💪 Steroids` / `⚪ Normal` in the prompt footer |
| Turn the whole thing on or off | Edit `settings.json` by hand | `/steroids on` or `/steroids off` |
| Commit messages | `Co-Authored-By: Claude` by default | One question at install time and one `CLAUDE.md` rule |
| Using your plugins | The model decides, often not to | A reminder in the system prompt plus `CLAUDE.md` rules |

## See it work

*These are illustrative animations of measured behaviour, not screen recordings.*

| Toggle | Fallback | Compression |
|---|---|---|
| ![toggle](assets/demo-toggle.gif) | ![fallback](assets/demo-fallback.gif) | ![compression](assets/demo-compression.gif) |

## Quick start (about 5 minutes)

You need: **Node 22.22.2 or newer**, **Claude Code 2.1+** and at least one model provider you can log into (your Claude plan, Gemini, GitHub Copilot...).

```bash
# 1. Get it
git clone https://github.com/Sam-SSD/Claude-Steroids-Mod
cd Claude-Steroids-Mod

# 2. Install: copies the switch, installs the plugin, asks before touching CLAUDE.md / settings.json
node setup/setup.mjs install --with=ponytail,frontend-design     # --with is optional

# 3. Start the gateway and open its dashboard
omniroute serve --daemon          # http://localhost:20128
```

4. In the dashboard: **connect your providers** and **create an API key**. These need your accounts, so no script can do them for you. Paste the key in `~/.claude/steroids/steroids.json` (`"apiKey"`). Edit the `chains` there to match the models your accounts can use (`omniroute models` lists them).

```bash
# 5. Create the three combos, test each one, turn compression on
node setup/setup.mjs combos
```

Then, inside Claude Code:

```
/steroids on
```

Open a **new** session. The footer shows `💪 Steroids`. Done.

> Only want the plugin? In Claude Code: `/plugin install steroids --marketplace Sam-SSD/Claude-Steroids-Mod`. That installs the mod alone; `/steroids on` also needs `~/.claude/steroids/toggle.js` and `steroids.json`, which step 2 creates.

> Prefer a desktop button? Copy `setup/shortcuts/Steroids ON.bat` and `Steroids OFF.bat` to your desktop (Windows).

## Usage examples

**Turn it on and check**
```
/steroids on        → writes the gateway into settings.json (after an end-to-end test)
/steroids status    → "This session: normal connection. New sessions: will use Steroids."
```
Sessions that are already open keep the connection they started with; open a new one.

**Your plan runs out mid-project.** Claude Code asks for `opus`; Steroids sends it to `steroids-opus`, a priority chain: `claude-opus-5-5 → another provider's Claude → Gemini → Copilot`. If the first one refuses, OmniRoute tries the next. You keep working, possibly on a weaker model.

**A tool returns a big JSON.** An API call or a database query returns 600 rows. With compression on, Claude is billed ~47 % fewer input tokens for that result and still finds the needle in it (`bench/compress-json.mjs` proves it on your machine).

**Leader + builders.** Open four terminals: one on `opus`, two on `sonnet`, one on `haiku`. Each alias has its own chain, so the leader and the builders can fall back independently.

**Clean commits.** `claude -p "commit a.txt"` creates the commit under your own `git config` identity, with no `Co-Authored-By` trailer (tested over 4 real commits).

## What it changes on your machine

| Where | What |
|---|---|
| `~/.claude/steroids/` | `toggle.js` (the switch) and `steroids.json` (your key and chains, **never commit it**) |
| `~/.claude/settings.json` | `/steroids on` adds `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_DEFAULT_*_MODEL`; `off` removes them. A backup `settings.json.bak-steroids` is written every time |
| OmniRoute | Three combos `steroids-opus/sonnet/haiku` and a lossless compression preset (your previous setting is saved and `compression off` restores it) |
| `~/.claude/CLAUDE.md` *(optional)* | A marked block between `<!-- steroids:plugins -->` markers |

How it works in detail: [docs/how-it-works.md](docs/how-it-works.md). Something broke? [docs/troubleshooting.md](docs/troubleshooting.md).

## Measured results

Same prompt, same model (Haiku), input tokens billed by Claude. Reproduce with `node setup/setup.mjs compression off|on` and `node bench/compress-json.mjs`.

| Tool result | Compression off | Compression on | Needle recovered |
|---|---|---|---|
| 600-row JSON (`bench/compress-json.mjs`) | 29,351 | **15,586 (−46.9 %)** | yes, both runs |
| `git log --stat` (120 KB) | 57,535 | 57,535 (0 %) | yes |
| `ls -laR` (100 KB) | 68,180 | 68,180 (0 %) | yes |

The last two rows came from a quick ad-hoc test that is not in this repo. Code files were not measured with OmniRoute's engine. Details and caveats: [docs/benchmarks.md](docs/benchmarks.md).

## Limitations and honesty

- **Real quota exhaustion has not been observed.** I verified that every link of my chain answers and can call tools, and I saw exhausted models return their quota errors. I have not yet watched a complete Claude → fallback switch happen on its own inside a combo, so that part relies on OmniRoute's documented `priority` strategy.
- **Switching models mid-task changes quality.** A fallback model is usually weaker than your first choice.
- **claude.ai connectors are disabled while Steroids is on** (Drive, Docs, Slides...). Claude Code does that whenever `ANTHROPIC_AUTH_TOKEN` is set. `/steroids off` brings them back in new sessions.
- **Terms of service.** Routing your Claude *subscription* through a third-party gateway may not be allowed by your plan's terms. Check them, or use an API key.
- **New sessions only.** An open session never changes connection.
- **Warning in the log:** `unrecognized_model steroids-opus[1m]`. It is harmless; the `[1m]` suffix is only a hint of a 1M context.
- **Tested only on Windows 10**, Claude Code 2.1.319, OmniRoute 3.8.53, Node 22.23.4. macOS and Linux should work (paths are portable) but are untested.
- **Early-access API.** Claude Code's function-hooks plugin API may change between releases.
- The API key sits in plain text in two local files. Keep OmniRoute bound to `localhost`.
- Windows tip: hook commands written with backslashes fail under Git Bash (`command not found`). Use forward slashes.

## Uninstall

```bash
# in Claude Code
/steroids off
claude plugin uninstall steroids@claude-steroids
claude plugin marketplace remove claude-steroids
# then
node setup/setup.mjs compression off      # restore OmniRoute's previous compression
npm rm -g omniroute                       # optional
rm -r ~/.claude/steroids                  # optional
```
Remove the block between the `steroids:plugins` markers in `~/.claude/CLAUDE.md`, or restore `CLAUDE.md.bak-steroids` / `settings.json.bak-steroids`.

## FAQ

**Do I need all the providers?** No. One provider is enough; fallbacks only matter if you connect more.
**Does it send my code anywhere new?** Requests go to the providers *you* connected, through a gateway running on your machine.
**Can I use it without the plugins you mention?** Yes. `--with` is optional and `plugins` in `steroids.json` can be empty.
**My models have different names.** Run `omniroute models` and edit `chains` in `steroids.json`, then `node setup/setup.mjs combos` again.

## Credits

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) does the routing and the compression; this repo only wires it into Claude Code and documents how. Plugins mentioned: [ponytail](https://github.com/DietrichGebert/ponytail), `frontend-design`, [MemPalace](https://github.com/MemPalace/mempalace).

## License

[MIT](LICENSE) © Sam-SSD
