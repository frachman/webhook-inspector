# Deployment Overview

This document describes the public release principles for Webhook Inspector.
Hostnames, IP addresses, server paths, credentials, and operator commands are
intentionally kept out of the public repository.

## Release principles

- Run API integration tests, web builds, and container image builds in CI.
- Publish immutable container images from verified `main` commits.
- Keep PostgreSQL and the API private behind the web reverse proxy.
- Require encrypted, off-host database backups and a tested restore path.
- Run health checks after deployment, alert on failures, and keep a recoverable
  previous release.
- Verify the public homepage, endpoint creation, webhook capture, and viewer flow.

## Current status

The first public release is live. CI, immutable image publishing, encrypted
PostgreSQL backup automation, restore verification, rate limiting, health
monitoring, failure alerting, bilingual onboarding, and SEO metadata are in
place.

## Public safety boundary

Detailed operator procedures belong in private infrastructure documentation. Do
not add SSH keys, passwords, server addresses, private backup locations, raw
webhook captures, internal hostnames, or unreleased financial plans here.
