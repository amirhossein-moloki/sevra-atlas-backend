# Sevra Atlas Project Documentation

Welcome to the central documentation repository for Sevra Atlas. This directory is organized into specialized modules to serve engineers, SREs, security auditors, and stakeholders.

## Directory Structure

| Folder | Purpose |
| :--- | :--- |
| `/architecture` | High-level system design, diagrams, and component lifecycles. |
| `/backend` | Core API logic, database schemas, and service-level documentation. |
| `/admin` | AdminJS configuration, customization, and backoffice operations. |
| `/workers` | Background job processing, BullMQ architecture, and job types. |
| `/caching` | Multi-layer caching strategy (Nginx, Redis, Browser). |
| `/infra` | VPS topology, Docker configuration, and deployment manifests. |
| `/security` | Authentication models, CSP rules, and security hardening details. |
| `/runbooks` | Incident response procedures for production failures. |
| `/adr` | Architecture Decision Records (Historical context for design choices). |
| `/api` | API Reference, error envelopes, and contract validation guides. |
| `/compliance` | Regulatory documentation and data privacy policies. |
| `/ci-cd` | Pipeline definitions, automation flows, and release management. |
| `/mobile` | Mobile-specific integration strategies and API usage. |
| `/testing` | Test strategies, contract testing, and load testing protocols. |
| `/operations` | Daily maintenance, backups, and monitoring guides. |
| `/business` | Executive summaries and investor-facing technical reports. |

## Documentation Principles
1. **Source of Truth**: Documentation should reflect the current state of the `main` branch.
2. **Diagrams First**: Use ASCII or Mermaid diagrams for complex logic.
3. **Actionable**: Runbooks and infra guides must be copy-paste friendly.
4. **Verifiable**: API docs must match the OpenAPI specification.
