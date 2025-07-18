# InfoMetis

InfoMetis - container orchestration made simple.

## Overview

InfoMetis implements a lightweight, event-driven choreography approach to container orchestration, focusing on simplicity and operational efficiency. Built on Kubernetes (k0s/kind) with NiFi data processing and automated pipeline management.

## Quick Start

### Prerequisites
- Docker installed and running
- Node.js v14+ for console interface
- 8GB+ RAM available
- Internet connection for initial image caching (optional)

### Deploy InfoMetis v0.1.0
```bash
# Interactive console deployment
cd v0.1.0
node console.js

# Quick deployment sequence:
# C -> 2 (Cache images - optional, for offline)
# a (Auto mode - full deployment)

# Access URLs:
# NiFi UI: http://localhost/nifi/ (admin/adminadminadmin)
# Traefik Dashboard: http://localhost:8082/dashboard/
```

## Project Structure

### v0.1.0 Implementation (`v0.1.0/`)
Production-ready implementation with self-contained deployment package:
- **[v0.1.0 README](v0.1.0/README.md)** - Complete deployment guide with console interface
- **Interactive Console** - Section-based navigation (C/I/D/T/X sections)
- **Image Caching** - Offline deployment support for low-bandwidth environments  
- **Implementation Scripts** - All deployment automation (C1, I2, D3 naming)
- **Kubernetes Manifests** - Production-ready k0s + Traefik + NiFi configuration

### Documentation (`docs/`)
Development and design documentation:
- **[Console UI Roadmap](docs/console-ui-roadmap.md)** - Console interface development plan
- **[Implementation Console Roadmap](docs/implementation-console-roadmap.md)** - Implementation strategy
- **Architecture** - Core platform design and deployment patterns

## Additional Documentation

### Architecture & Strategy
- **[Foundations](docs/foundations/README.md)** - Core architecture and deployment strategy
- **[NiFi WSL Platform](docs/nifi-wsl-dev-platform/README.md)** - Development platform design
- **[Complete Data Platform Plan](docs/complete-data-platform-plan.md)** - Comprehensive platform architecture

### Implementation Strategy
- **[Environment Setup](docs/environment-setup.md)** - Development environment configuration
- **[NiFi Pipeline Automation](docs/nifi-pipeline-automation-design.md)** - Automation system design
- **[Component Extraction Strategy](docs/component-extraction-strategy.md)** - Modular development approach

## Key Features

- **Interactive Console**: Section-based deployment interface with auto mode
- **Offline Support**: Complete image caching for low-bandwidth environments
- **k0s in Docker**: Lightweight Kubernetes with volume mounts for persistence
- **Traefik Ingress**: Modern reverse proxy with conflict-free port configuration
- **NiFi Platform**: Content-aware intelligence pipeline with local storage
- **Production Ready**: Validated deployment with comprehensive troubleshooting

---

## Development Operations

This repository includes a comprehensive operational framework for AI-assisted development workflow management.

### Core Operational Guide
- **[CLAUDE.md](CLAUDE.md)** - Essential operational guidance and mandatory rules for AI-assisted development

### Workflow Orchestration (WOW)
- **[Workflow Registry](claude/wow/KEYWORD_REGISTRY.md)** - Complete workflow system with "sesame" triggers
- **[Operational Rules](claude/wow/workflows/OPERATIONAL_RULES.md)** - Mandatory operational procedures
- **Session Management** - Automated session start/end workflows with audit logging
- **Git Workflow Automation** - Structured branch management and PR workflows
- **Release Process** - Automated version management and release creation

### Project Management
- **[Phase-Based Development](claude/wow/docs/phase-based-development-strategy.md)** - PRINCE2-inspired development approach
- **[Branching Strategy](claude/wow/docs/branching-strategy.md)** - GitHub Flow with integrated TDD
- **Issue Tracking** - Automated issue selection and implementation workflows
- **Version Planning** - Structured milestone and version management

### Automation Tools
- **Audit System** - Comprehensive operational logging and metrics
- **Workflow Recommender** - AI-powered workflow suggestions
- **Repository Maintenance** - Automated cleanup and optimization
- **Knowledge Management** - Documentation synchronization and updates
