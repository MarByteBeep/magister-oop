# Finalize

Never use `cd ... &&`.
Run commands directly.

## Checks

Run:

```text
bun run check
bun run check:ci
bun run check:fallow
```

Fix all issues found.

Repeat until all commands pass.

## Rules

Before finishing, review the **changed and Added** files against the project rules in `.cursor/rules/`. Read those rule files and fix any violations in this work — do not leave them for later.

Only finish when checks are green **and** the change set complies with those rules.
