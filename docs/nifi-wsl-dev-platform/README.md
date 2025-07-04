[← Back to InfoMetis Home](../../README.md)

# NiFi WSL Dev Platform

## Overview

The NiFi WSL Development Platform is InfoMetis's first deliverable - a comprehensive development environment for Apache NiFi with Collaborative AI (CAI) integration, specifically designed for WSL environments.

## Platform Purpose

This platform provides developers with a **zero-install, production-equivalent NiFi development environment** that can be deployed in minutes on WSL systems, complete with:

- **Apache NiFi deployment** using Kubernetes (kind)
- **Collaborative AI pipeline creation** through conversational interfaces
- **Complete user documentation** for setup and operation
- **Progressive service expansion** through structured version releases

## Platform Components

### Current Implementation (v0.1.0)
- **Core Service**: Apache NiFi for data flow automation
- **Container Platform**: kind (Kubernetes in Docker) for WSL compatibility
- **CAI Integration**: Simple collaborative AI pipeline creation support
- **Documentation**: Complete user setup and operation guides
- **Automation**: Basic conversational pipeline creation capabilities

### Platform Evolution
See **[Platform Roadmap](./roadmap.md)** for detailed progression through v0.1.0 → v0.5.0

## Key Features

### Zero-Install Architecture
- No manual software installation on host system
- Everything runs in containers through Kubernetes
- Easy cleanup and management
- Minimal host system impact

### WSL Optimized
- Specifically designed for WSL environments
- Avoids WSL Unix socket limitations through kind
- Optimized file system and network patterns
- Compatible with Windows development workflows

### Collaborative AI Integration
- Conversational pipeline creation and management
- AI-assisted troubleshooting and optimization
- Natural language service interaction
- Progressive enhancement through version releases

### Production Alignment
- Uses production-equivalent technologies (Kubernetes, industry-standard services)
- Same architectural patterns as production deployments
- Clear promotion path from development to production
- Consistent behavior across environments

## Documentation Structure

### Platform Documentation
- **[Platform Roadmap](./roadmap.md)** - Version progression and feature evolution
- **User Guides** - Setup and operation documentation (to be created)
- **Developer Guides** - Platform development and contribution (to be created)

### Strategic Context
- **[InfoMetis Foundations](../foundations/)** - Long-term architecture and vision
- **Project Configuration** - Version and project metadata

## Getting Started

*Note: Detailed setup guides will be created as part of v0.1.0 deliverable completion*

### Prerequisites
- WSL environment with Docker support
- Basic familiarity with command-line tools
- Git for configuration management

### Quick Start
1. Clone InfoMetis repository
2. Run platform deployment scripts
3. Access NiFi through provided URLs
4. Begin pipeline creation through CAI interface

## Development Philosophy

- **KISS Principle**: Keep implementations simple and maintainable
- **PRINCE2 Planning**: "Just enough planning" - defer complex planning until needed
- **Service-per-Version**: Add one new service component per version
- **Progressive Enhancement**: CAI capabilities evolve alongside platform
- **TDD Transition**: Moving toward strict Test-Driven Development practices

---

*NiFi WSL Development Platform - InfoMetis Service Orchestration Platform First Deliverable*