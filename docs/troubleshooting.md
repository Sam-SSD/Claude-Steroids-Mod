# Troubleshooting

## Claude Code does not answer at all after `/steroids on`
The gateway is down but `settings.json` still points at it. From any terminal:
```bash
node ~/.claude/steroids/toggle.js ensure    # start the gateway again
node ~/.claude/steroids/toggle.js off       # or remove Steroids from settings.json
```
The mod already runs `ensure` at every session start, but it cannot help a session that fails before the mod loads. Last resort: delete the five `ANTHROPIC_*` lines from the `env` block of `~/.claude/settings.json`, or copy back `settings.json.bak-steroids`.

## `ERROR: the API key was rejected or the test failed`
`/steroids on` tests the full path before touching anything. Check that `apiKey` in `~/.claude/steroids/steroids.json` is the key from the OmniRoute dashboard (API Keys), that the combos exist (`omniroute combo list`) and that the provider behind your first model is connected (`omniroute providers list`).

## OmniRoute will not start: "Node ... is below the patched minimum"
OmniRoute needs Node 22.22.2+, 24+, 25+ or 26+. Upgrade Node (on Windows: `winget upgrade OpenJS.NodeJS.22`), then reinstall with `npm i -g omniroute@latest`. If the install was interrupted and `omniroute -v` fails with a missing module, remove the global folder and install again.

## `The requested model is not supported` / `not available in the active live catalog`
Your account does not offer that model, or it is out of quota right now. Run `omniroute models <provider>`, edit `chains` in `steroids.json` and run `node setup/setup.mjs combos` again.

## The badge does not appear
It is drawn in the prompt footer on the terminal and desktop surfaces only. Run `/reload-plugins`, or open a new session. Confirm the plugin is enabled: `claude plugin list`.

## `/steroids` is not found
Install the plugin (`claude plugin install steroids@claude-steroids --scope user`) and open a new session. In Git Bash on Windows, a command typed as `claude -p "/steroids status"` is turned into a file path; prefix it with `MSYS_NO_PATHCONV=1`.

## `command not found` in a SessionStart hook (Windows)
A hook whose command contains backslashes (`C:\Users\...`) is broken by Git Bash. Write the path with forward slashes (`C:/Users/...`).

## Port 20128 is taken
Start OmniRoute on another port (`omniroute serve --port 20130`) and set `baseUrl` to match in `steroids.json`.

## Rotate the API key
`omniroute keys rotate <id>`, then paste the new one into `steroids.json` and run `/steroids on` again.

## Where is the log?
Run Claude Code with `claude --debug-file <path>`; hook failures and the gateway's errors show there.
