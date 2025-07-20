# InfoMetis

InfoMetis - container orchestration made simple.

## Overview

InfoMetis implements a lightweight, event-driven choreography approach to container orchestration, focusing on simplicity and operational efficiency. Built on Kubernetes (k0s/kind) with NiFi data processing and automated pipeline management.

## 🗺️ Version Roadmap

| Version | Status | Focus | Key Features |
|---------|--------|-------|--------------|
| **v0.1.0** | ✅ **COMPLETE** | Foundation Platform | k0s + Traefik + NiFi, Interactive Console, Offline Support |
| **v0.2.0** | 🚧 **IN PROGRESS** | Registry Integration | NiFi Registry + Git Integration, Flow Version Control |
| **v0.3.0** | 📋 **PLANNED** | Advanced Pipelines | Template System, Advanced Registry Features |
| **v0.4.0** | 📋 **PLANNED** | Enterprise Features | Multi-Environment, RBAC, Advanced Security |

### 🎯 Current Status: v0.2.0 Implementation

**✅ COMPLETED**:
- NiFi Registry deployment with persistent storage
- Git flow persistence provider configuration  
- Registry-NiFi integration and client setup
- External access via Traefik routing
- Comprehensive automated test suite

**🚧 IN PROGRESS**:
- Advanced pipeline testing and validation
- Template system development
- Documentation enhancement

**📋 READY TO USE**:
- Full v0.1.0 foundation (production-ready)
- v0.2.0 Registry integration (functional, testing in progress)

## 🚀 Quick Start

Choose your version based on your needs:

### 🎯 **Option A: v0.2.0 - Latest with Registry** (Recommended for Development)
Full platform with NiFi Registry and Git integration for flow version control.

**Prerequisites:**
- Docker installed and running
- 8GB+ RAM available
- Internet connection for image downloads

```bash
# 1. Deploy complete v0.2.0 platform
cd v0.2.0
./implementation/D1-deploy-v0.1.0-foundation.sh
./implementation/D2-deploy-v0.1.0-infometis.sh
./implementation/I1-deploy-registry.sh
./implementation/I2-configure-git-integration.sh  
./implementation/I3-configure-registry-nifi.sh

# 2. Verify deployment
./implementation/I4-verify-registry-setup.sh

# 3. Optional: Run automated tests
./implementation/T1-run-all-tests.sh

# 🌐 Access Points:
# NiFi UI: http://localhost/nifi
# Registry UI: http://localhost/nifi-registry  
# Traefik Dashboard: http://localhost:8082
```

### 🏗️ **Option B: v0.1.0 - Stable Foundation** (Recommended for Production)
Production-ready foundation platform with interactive console.

**Prerequisites:**
- Docker installed and running
- Node.js v14+ for console interface
- 8GB+ RAM available

```bash
# Interactive console deployment
cd v0.1.0
node console.js

# Quick deployment sequence:
# C -> 2 (Cache images - optional, for offline)
# a (Auto mode - full deployment)

# 🌐 Access Points:
# NiFi UI: http://localhost/nifi/ (admin/adminadminadmin)
# Traefik Dashboard: http://localhost:8082/dashboard/
```

### 🧪 **Want to Contribute or Test?**
- **Test v0.2.0**: Run `./implementation/T1-run-all-tests.sh` for comprehensive validation
- **Report Issues**: Use our [GitHub Issues](https://github.com/user/InfoMetis/issues) 
- **Extend Features**: Check the [Development Section](#development-operations) below

## 📂 Project Structure & Implementation Details

### 🆕 **v0.2.0 Implementation** (`v0.2.0/`) - Latest
**Status**: 🚧 In Progress - Registry integration functional, advanced features in development

**What's Implemented:**
- **[📖 v0.2.0 README](v0.2.0/README.md)** - Complete deployment guide and architecture
- **🗂️ NiFi Registry Deployment** - Persistent storage with Kubernetes StatefulSet
- **🔄 Git Flow Persistence** - Automatic Git commits for flow versions (no remote repo needed)
- **🔗 Registry-NiFi Integration** - Flow version control client configured in NiFi
- **⚙️ Centralized Configuration** - Unified container image management
- **🌐 Traefik Routing** - Registry UI accessible at `http://localhost/nifi-registry`
- **🧪 Automated Test Suite** - Complete validation with `T1-run-all-tests.sh`

**Key Scripts:**
```bash
# Deployment
./implementation/I1-deploy-registry.sh        # Deploy Registry
./implementation/I2-configure-git-integration.sh # Setup Git persistence  
./implementation/I3-configure-registry-nifi.sh   # Connect NiFi to Registry

# Testing & Validation
./implementation/I4-verify-registry-setup.sh     # Verify deployment
./implementation/T1-run-all-tests.sh            # Complete test suite
./implementation/P1-create-test-pipeline.sh     # Create test pipelines
./implementation/R1-reset-nifi-clean.sh         # Reset for clean testing
```

### 🏗️ **v0.1.0 Implementation** (`v0.1.0/`) - Stable Foundation  
**Status**: ✅ Complete - Production ready with comprehensive console interface

**What's Implemented:**
- **[📖 v0.1.0 README](v0.1.0/README.md)** - Complete deployment guide with console interface
- **🖥️ Interactive Console** - Section-based navigation (C/I/D/T/X sections) with auto mode
- **📦 Image Caching** - Offline deployment support for low-bandwidth environments
- **🔧 Implementation Scripts** - All deployment automation (C1, I2, D3 naming convention)
- **☸️ Kubernetes Manifests** - Production-ready k0s + Traefik + NiFi configuration
- **🛠️ Troubleshooting** - Comprehensive problem resolution guides

**Key Features:**
```bash
node console.js    # Interactive console with guided deployment
# Sections: C(aching), I(nfrastructure), D(eployment), T(esting), eX(perimental)
```

### 📋 **What Users Can Do Right Now:**

**✅ Ready for Production Use:**
- Deploy stable v0.1.0 foundation platform
- Run NiFi pipelines with persistent storage
- Use interactive console for guided setup
- Deploy in offline environments with image caching

**✅ Ready for Development/Testing:**
- Deploy v0.2.0 with Registry integration
- Create and version control NiFi flows
- Run comprehensive automated tests
- Test Git-based flow persistence

**🤝 Ready for Contribution:**
- Run test suites to validate functionality
- Report issues or suggest improvements
- Extend test coverage for additional scenarios
- Develop v0.3.0 features (templates, advanced Registry features)

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

## ⭐ Key Features

### 🆕 **v0.2.0 - Registry Integration** (Latest)
- **🗂️ NiFi Registry**: Complete flow version control with persistent Kubernetes storage
- **🔄 Git Integration**: Automatic Git commits for flow versions (local Git, no remote required)
- **🔗 Registry-NiFi Client**: Seamless flow version control directly in NiFi UI
- **⚙️ Centralized Configuration**: Unified container image management across components
- **🌐 Traefik Routing**: Registry UI at `http://localhost/nifi-registry` without conflicts
- **🧪 Automated Testing**: Comprehensive test suite with step-by-step validation
- **📦 Production Ready**: Built on proven v0.1.0 foundation

### 🏗️ **v0.1.0 - Stable Foundation** (Production Ready)
- **🖥️ Interactive Console**: Section-based deployment with guided auto mode
- **📦 Offline Support**: Complete image caching for air-gapped/low-bandwidth environments
- **☸️ k0s in Docker**: Lightweight Kubernetes with persistent volume mounts
- **🌐 Traefik Ingress**: Modern reverse proxy with intelligent port configuration
- **🔧 NiFi Platform**: Content-aware intelligence pipelines with local storage
- **🛠️ Production Validated**: Comprehensive deployment validation and troubleshooting guides

### 🎯 **Common Platform Benefits**
- **🚀 Simple Deployment**: One-command or guided console installation
- **💾 Data Persistence**: All data survives container restarts
- **🔒 Security**: Local-only deployment, no external dependencies required
- **📊 Monitoring**: Traefik dashboard for infrastructure visibility
- **🔧 Extensible**: Clear architecture for custom pipeline development
- **📚 Well Documented**: Comprehensive guides for all skill levels

---

## 🤝 Getting Started for Contributors

### Quick Test Drive (5 minutes)
```bash
# Test the latest features
git clone <repo-url>
cd InfoMetis/v0.2.0
./implementation/T1-run-all-tests.sh
```

### Development Workflow
```bash
# Option 1: Start with stable foundation, add Registry
cd v0.1.0 && node console.js  # Deploy foundation
cd ../v0.2.0/implementation && ./I1-deploy-registry.sh  # Add Registry

# Option 2: Full v0.2.0 from scratch
cd v0.2.0/implementation
./D1-deploy-v0.1.0-foundation.sh && ./D2-deploy-v0.1.0-infometis.sh
./I1-deploy-registry.sh && ./I2-configure-git-integration.sh && ./I3-configure-registry-nifi.sh
```

### What to Contribute
- **🧪 Test Coverage**: Run tests, report issues, add test scenarios
- **📚 Documentation**: Improve guides, add examples, fix typos
- **⚡ Features**: Implement v0.3.0 roadmap items (templates, advanced Registry)
- **🔧 Fixes**: Address GitHub issues, improve deployment reliability
- **🎯 Use Cases**: Share your pipeline implementations and patterns

### Getting Help
- **📖 Documentation**: Check version-specific READMEs first
- **🐛 Issues**: [GitHub Issues](https://github.com/user/InfoMetis/issues) for bugs/features
- **💬 Discussions**: For questions, ideas, and community support

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
