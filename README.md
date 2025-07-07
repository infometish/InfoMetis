# InfoMetis

InfoMetis - container orchestration made simple.

## Overview

InfoMetis implements a lightweight, event-driven choreography approach to container orchestration, focusing on simplicity and operational efficiency. Built on Kubernetes (k0s/kind) with NiFi data processing and automated pipeline management.

## Quick Start

### Prerequisites
See [infometis/PREREQUISITES.md](infometis/PREREQUISITES.md) for system requirements.

### Deploy InfoMetis
```bash
# Setup Kubernetes cluster (kind for WSL, k0s for Linux)
./infometis/scripts/setup/setup-cluster.sh

# Deploy NiFi
kubectl apply -f infometis/deploy/kubernetes/nifi-k8s.yaml

# Create automated pipelines
./nifi-automation/scripts/create-pipeline.sh customer-pipeline
```

## Project Structure

### Implementation (`infometis/`)
Complete v0.1.0 implementation with working deployment:
- **[InfoMetis README](infometis/README.md)** - Deployment instructions and component overview
- **[Prerequisites](infometis/PREREQUISITES.md)** - System requirements and setup guide
- **Deployment Scripts** - Automated setup for Kubernetes and NiFi
- **Test Suite** - TDD validation scripts for all components

### NiFi Automation Framework (`nifi-automation/`)
Production-ready pipeline automation system:
- **[Automation README](nifi-automation/README.md)** - Complete automation framework documentation
- **[Example Usage](nifi-automation/EXAMPLE_USAGE.md)** - Practical pipeline creation examples
- **Pipeline Templates** - Reusable YAML-based pipeline configurations
- **Dashboard System** - Operational monitoring and management

## Documentation

### Current Architecture
- **[Foundations](docs/foundations/README.md)** - Core architecture and deployment strategy
- **[NiFi WSL Platform](docs/nifi-wsl-dev-platform/README.md)** - Development platform design
- **[Environment Setup](docs/environment-setup.md)** - Development environment configuration

### Design Documents
- **[Complete Data Platform Plan](docs/complete-data-platform-plan.md)** - Comprehensive platform architecture
- **[NiFi Pipeline Automation](docs/nifi-pipeline-automation-design.md)** - Automation system design
- **[NiFi Registry Integration](docs/nifi-registry-integration.md)** - Version control strategy

## Key Features

- **Automated Deployment**: One-command cluster and service setup
- **Pipeline Automation**: Template-based NiFi pipeline creation via REST API
- **Multi-Platform Support**: Optimized for both WSL (kind) and Linux (k0s)
- **TDD Validation**: Comprehensive test suite for all components
- **GitOps Ready**: Prepared for FluxCD integration (future release)

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
