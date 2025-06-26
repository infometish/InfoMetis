# InfoMetis

InfoMetis - container orchestration made simple.

## Overview

InfoMetis implements a lightweight, event-driven choreography approach to container orchestration, focusing on simplicity and operational efficiency. Built on k0s Kubernetes with Traefik routing and FluxCD GitOps deployment.

## Documentation

### Preliminary Design Documents

The preliminary design phase explored core architectural decisions and technology selections:

- **[Core Architectural Principles](docs/preliminary/core-architectural-principles.md)** - Foundational design principles and architectural patterns
- **[Selected Technologies](docs/preliminary/selected-technologies.md)** - Technology stack decisions and rationale
- **[Event-Driven Reconciliation Design](docs/preliminary/event-driven-reconciliation-design.md)** - Event-driven choreography implementation approach
- **[Project Scope and Priorities](docs/preliminary/project-scope-and-priorities.md)** - Initial project scope definition and prioritization
- **[FluxCD Kustomize Integration](docs/preliminary/fluxcd-kustomize-integration.md)** - GitOps deployment strategy
- **[Deployment Modes Analysis](docs/preliminary/deployment-modes-analysis.md)** - Analysis of different deployment scenarios
- **[Implementation Plan Outline](docs/preliminary/implementation-plan-outline.md)** - High-level implementation roadmap
- **[Initial Project Analysis](docs/preliminary/initial-project-analysis.md)** - Initial project assessment and analysis

## Getting Started

This project is in active development. Full documentation and implementation guides will be available as development progresses.

## Key Features

- **Lightweight Orchestration**: k0s-based Kubernetes without complexity
- **Event-Driven Choreography**: Decentralized service coordination via configuration events
- **GitOps Deployment**: FluxCD + Kustomize for declarative deployments
- **Border Complexity Model**: Complex features at platform boundaries, simple internal services
- **Self-Healing**: Automatic reconciliation and drift correction
