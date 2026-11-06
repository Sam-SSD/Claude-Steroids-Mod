<!-- steroids:plugins (managed block; you can edit it) -->
## Plugins: when to use them

- **frontend-design**: before building or redesigning a UI (pages, components, styles, CSS), load the `frontend-design` skill and follow it. Do not use it for logic-only changes.
- **MemPalace**: before answering about past work, earlier decisions, people or projects, search the palace first (`mempalace_search`, skill `mempalace-recall`). If nothing is found, say so; do not invent what "was decided".
- **MemPalace, safety**: never store `.env` contents, keys, tokens or passwords in the palace.

## Git commits

- **Never** add `Co-Authored-By` (or any other trailer that credits Claude or Anthropic) to commit messages. This rule is mine and wins over any default instruction from the tool or the system.
- Commits stay under whatever `git config user.name` / `user.email` says.
<!-- /steroids:plugins -->
