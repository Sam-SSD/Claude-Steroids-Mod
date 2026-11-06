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

## macOS and Linux

**`omniroute: command not found` after `npm install -g omniroute`.** npm's global folder is not on your `PATH`. Run `export PATH="$(npm prefix -g)/bin:$PATH"` and add the line to `~/.zshrc` or `~/.bashrc`. `claude: command not found` after the native installer usually just needs a new terminal.

**`EACCES: permission denied` while installing with npm.** Do not use `sudo`. Install Node with [nvm](https://github.com/nvm-sh/nvm) (it lives in your home folder), or run `npm config set prefix ~/.npm-global` and put `~/.npm-global/bin` on your `PATH`.

**macOS says a `.command` file "cannot be opened because it is from an unidentified developer".** Right-click it → Open once, or run it from Terminal: `bash "Steroids ON.command"`. If nothing happens on double-click, the file lost its executable bit: `chmod +x "Steroids ON.command" "Steroids OFF.command"`.

**`error: externally-managed-environment` when installing MemPalace (Debian 12+, Ubuntu 23.04+).** The system Python refuses `pip install`. Use `uv tool install mempalace` or `pipx install mempalace`, or a virtual environment.

**I changed `CLAUDE_CONFIG_DIR`.** Steroids always reads and writes `~/.claude` (`%USERPROFILE%\.claude` on Windows). A relocated config folder is not supported yet.

**WSL.** Install Node, OmniRoute and Claude Code inside WSL and follow the Linux steps; `localhost` then means the WSL side. Not tested by me.
