# Contributing to Webhook Inspector

Thanks for helping improve Webhook Inspector. Small, focused contributions are
welcome, especially fixes that make webhook integration debugging safer and
easier.

## Before you start

- Read [`README.md`](README.md) for the project shape and local setup.
- Read [`AGENTS.md`](AGENTS.md) for repository safety and verification rules.
- Keep changes scoped to one problem or milestone.
- Do not include credentials, tokens, private URLs, captured webhook payloads,
  customer data, or production infrastructure details.

## Local development

The API uses Java 17, Maven, and PostgreSQL. The web viewer uses Node.js and
npm. The disposable PostgreSQL container documented in the README is the
recommended local database for development.

Run the relevant checks before opening a Pull Request:

```bash
./scripts/project.sh doctor
./scripts/project.sh verify
cd apps/web && npm ci && npm run build
```

The CI workflow also runs the secret scan, API tests, web build, and container
image builds. If a check cannot be run locally, explain why in the Pull Request.

## Branches and commits

- Create a topic branch from the latest `main`.
- Use Conventional Commit messages, for example:
  - `fix(api): reject oversized webhook bodies`
  - `docs(repo): clarify local setup`
  - `test(api): cover request retention`
- Keep commits reviewable and avoid unrelated formatting or dependency churn.
- Do not force-push shared branches.

## Pull Requests

Pull Requests should include:

- A short summary of the problem and solution.
- The verification commands that were run and their results.
- Any deployment, migration, security, or compatibility impact.
- Screenshots or request examples when a UI or output format changes.

Changes to application, deployment, or workflow files require review from the
repository owner through `CODEOWNERS`. Required CI checks must pass before a
Pull Request is merged.

## Webhook data and security

Use synthetic, non-sensitive payloads during development and testing. Treat all
captured headers and bodies as untrusted input. Report a suspected
vulnerability privately through GitHub's repository security channel rather
than opening a public issue with exploit details.
