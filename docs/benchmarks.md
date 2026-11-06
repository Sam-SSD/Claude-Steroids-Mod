# Benchmarks and what they do not prove

Everything here was measured on one machine (Windows 10, Claude Code 2.1.319, OmniRoute 3.8.53) against Haiku. The unit is the **input tokens Claude billed** for one request, read from the API's `usage`.

## The reproducible one

```bash
node setup/setup.mjs compression off && node bench/compress-json.mjs
node setup/setup.mjs compression on  && node bench/compress-json.mjs
```

The script sends a 600-row JSON array as a tool result, hides one value (`E-7Q4X-92`) in row 437 and asks for it.

| | Input tokens | Needle recovered |
|---|---|---|
| Compression off | 29,351 | yes |
| Compression on | 15,586 | yes |

Two runs of each gave identical numbers. **−46.9 %.**

## Informal tests (not in the repo)

Same method, other contents. These used an ad-hoc script I did not keep, so treat them as indicative.

| Content | Off | On |
|---|---|---|
| A similar 600-row JSON with an extra `tags` array | 32,358 | 18,593 (−42.5 %) |
| `git log --stat -n 300` (120 KB) | 57,535 | 57,535 (0 %) |
| `ls -laR` (100 KB) | 68,180 | 68,180 (0 %) |
| The same 60 KB `git log` returned twice in one conversation | 59,387 | 59,387 (no cross-turn dedup observed) |

In every informal case, a value hidden in the content was recovered correctly with and without compression.

Plain code files were **not** measured with OmniRoute's engine. A standalone compression proxy I tried briefly saved at most about 2 % on one TypeScript declaration file.

## What this does not tell you

- **One model, one payload shape.** Other tool results may compress more or less. Structured, repetitive JSON compresses; prose, logs and code did not.
- **Not the whole conversation.** Real sessions mix prompts, file reads and diffs, most of which this does not touch. Do not expect −47 % on a bill.
- **Answer quality.** I checked that a hidden value survives, not that every task is answered as well. Lossless here means "no engine that rewrites meaning is on", not a proof for all inputs.
- **No cost figures.** I did not translate tokens into money; prices depend on your plan.
- **Lossy engines were not benchmarked** (Caveman, Aggressive, LLMLingua, Ultra). They are off.
- **Failover was not benchmarked.** See the README's limitations.
