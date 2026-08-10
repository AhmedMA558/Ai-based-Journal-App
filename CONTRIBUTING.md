# Contributing

## Branching

One branch per unit of work, cut from `main`. Branch names describe the work, not the author: `<type>/<short-description>`, e.g. `security/jwt-auth-hardening-and-rabbitmq-fix`, `test/backend-coverage`, `docs/architecture-and-api-guides`. Don't stack unrelated work on one branch - if the scope grows into something separable, split it.

## Commits

`type(scope): summary`, imperative mood, no period. Types used in this repo's history: `feat`, `fix`, `test`, `refactor`, `docs`. Scope is usually the service/module name (`auth`, `frontend`, `journal-service`), or omitted for changes that span many files with one clear purpose (`feat: wire TOTP_ENCRYPTION_KEY through env and compose files`).

One commit per logical concern, not one giant commit per branch - e.g. a phase touching 8 services gets 8 commits, one per service, each independently reviewable. Before staging, review `git status`/`git diff` rather than `git add -A` blindly - pre-existing unrelated edits in the working tree can otherwise get swept into a commit that shouldn't include them.

## Pull requests

PRs are opened and merged manually by the maintainer - there's no `gh` CLI/token access in this environment, so branches get pushed and the PR is created through the GitHub UI. Give the PR title/description the same accuracy bar as a commit message: state what changed and why, and call out any deliberate behavior change (not just bug fixes) explicitly rather than letting it surface as a surprise in review.

## Before opening a PR

```bash
mvn test          # backend, full reactor - requires Docker for the Testcontainers-backed tests
cd frontend
npm run typecheck
npm run lint
npm run test
npm run build
```

For changes with a visible frontend effect, do a manual pass in a running browser too - type checks and unit tests verify correctness, not that the feature actually works end to end.

## A pattern worth knowing before you start

Repeatedly across this project's history, a feature that *looks* done (a UI element renders, an endpoint exists) turned out to be fully mocked or silently broken underneath - a fully-mocked search backend, AI endpoints returning 404s masked by a swallowed exception, a RabbitMQ listener bound to the wrong queue, documentation claiming Redis-backed token rotation that was never implemented. Verify current behavior by reading the code (or running it) before trusting what the UI, a doc, or a variable name implies. See root `CLAUDE.md` for the specific gotchas already found.
