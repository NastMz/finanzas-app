---
name: finanzas-commit-workflow
description: Prepare commits for finanzas-app with the repository's existing hook and message conventions. Use when the user asks to commit, prepare a clean change set, or verify that staged work is ready for git commit or git push.
---

# Finanzas Commit Workflow

## Workflow

1. Inspect the tree before staging or committing.

- Review `git status --short` and the relevant diffs first.
- Separate unrelated user changes from the task at hand.

2. Validate before creating the commit.

- For focused code changes, run the nearest tests and `npm run typecheck` when shared types or exports changed.
- For broad or cross-layer changes, run `npm run lint`, `npm run typecheck`, and `npm run test`.
- For structural or procedural changes, explicitly assess whether `AGENTS.md` or a local skill should be updated before committing.
- Remember the hooks: `pre-commit` runs `npm run lint:staged`; `pre-push` runs `npm run typecheck && npm run test`.

3. Stage deliberately.

- Stage only files that belong to the requested task.
- Do not include `node_modules/`, `output/`, or incidental generated files unless the task explicitly requires them.

4. Follow the repo's message style.

- Use conventional commits such as `feat(scope): summary`, `fix(scope): summary`, `refactor(scope): summary`, `docs(scope): summary`, or `test(scope): summary`.
- Choose scopes that match the touched area: `web`, `ui`, `data`, `sync`, `platform`, `application`, `domain`, `docs`, or `structure`.
- Write the summary in imperative mood and keep it specific.

5. Avoid history rewriting unless asked.

- Do not amend, rebase, or rewrite unrelated commits unless the user explicitly asks for it.
