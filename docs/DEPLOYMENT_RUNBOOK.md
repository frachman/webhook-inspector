# Deployment Runbook Notice

Detailed deployment and recovery procedures are intentionally maintained in
private operator documentation, not in this public repository.

The public release process is summarized in [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md):
CI verification, immutable images, encrypted off-host backups, health checks,
and post-deployment smoke tests.

Never commit credentials, SSH material, server addresses, raw webhook data, or
private backup paths. Keep the private runbook access-controlled and review it
before every infrastructure change.
