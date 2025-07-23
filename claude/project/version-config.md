[← Back to Project Home](../../../README.md)

# Project Version Configuration

## Project Identity
- **PROJECT_NAME**: InfoMetis
- **ARTIFACT_NAME**: infometis-platform
- **REPOSITORY**: infometish/InfoMetis

## Version Strategy
- **CURRENT_VERSION**: 0.4.0
- **CURRENT_MILESTONE**: v0.4.0: Elasticsearch Integration
- **MILESTONE_NUMBER**: 3
- **VERSION_PATTERN**: semantic
- **RELEASE_TYPE**: service

## v0.1.0 Deliverable (COMPLETED)
- **RELEASE_NAME**: k0s NiFi Platform with Console Deployment
- **DESCRIPTION**: Self-contained InfoMetis NiFi development platform with interactive console deployment and offline support
- **KEY_FEATURES**:
  - k0s Kubernetes deployment in Docker container
  - Interactive console with section-based navigation (C/I/D/T/X)
  - Complete image caching for offline deployment
  - Traefik ingress controller with conflict-free port configuration
  - NiFi platform with local storage and StatefulSet deployment
  - Comprehensive automation scripts (24 deployment scripts)

## v0.3.0 Deliverable (COMPLETED)
- **RELEASE_NAME**: JavaScript Console Implementation
- **DESCRIPTION**: Complete conversion of shell scripts to JavaScript with interactive console UI and cross-platform compatibility
- **KEY_FEATURES**:
  - Native JavaScript deployment modules for all services
  - Interactive console with menu-driven navigation
  - Cross-platform compatibility (Windows, Linux, macOS)
  - Enhanced error handling and user feedback
  - Dual-target image caching (Docker + k0s containerd)
  - Press-any-key pacing for controlled deployment
  - Auto-execution mode for advanced users
  - Modular architecture with shared utility libraries

## GitHub Milestone Mapping
- **v0.1.0**: k0s NiFi Platform with Console Deployment (Milestone #1) - COMPLETED
- **v0.2.0**: NiFi Registry with Git Integration (Milestone #2) - COMPLETED  
- **v0.3.0**: Convert Console to JS scripts (Milestone #6) - COMPLETED
- **v0.4.0**: Elasticsearch Integration (Milestone #3) - CURRENT TARGET
- **v0.5.0**: Kafka Streaming Integration (Milestone #4) - PLANNED

## Current Milestone Issues (v0.4.0)
**Elasticsearch Integration - Priority order for execution:**
1. **Issue #63**: [ES] Elasticsearch Kubernetes Deployment Configuration
2. **Issue #64**: [ES] Elasticsearch Ingress and Service Setup
3. **Issue #65**: [ES] JavaScript Deployment Module for Elasticsearch
4. **Issue #66**: [ES] NiFi-Elasticsearch Integration Processors
5. **Issue #67**: [ES] Sample Data Pipeline with Elasticsearch Output
6. **Issue #68**: [ES] Console UI Integration for Elasticsearch Management
7. **Issue #69**: [ES] Elasticsearch Health Monitoring and Logging
8. **Issue #70**: [ES] End-to-End Test Suite for v0.4.0

**Additional Existing Issues (Updated with ES Epic Labels):**
- **Issue #19**: [ES] Elasticsearch Deployment
- **Issue #20**: [ES] Elasticsearch-NiFi Integration
- **Issue #21**: [ES] Data Flow Pipeline Templates for Elasticsearch
- **Issue #22**: [ES] Enhanced CAI for Search and Analytics
- **Issue #23**: [ES] Updated Documentation for Elasticsearch Features
- **Issue #24**: [ES] Enhanced Deployment Automation with Elasticsearch
- **Issue #25**: [ES] End-to-End Test Suite for v0.4.0
- **Issue #26**: [ES] Version Release Package for v0.4.0

## Version Numbering Rules
- **Major Version (X.0.0)**: 
  - Directory structure reorganization
  - Migration from monolithic to modular architecture
  - Breaking changes to deployment patterns
  - Incompatible API changes
- **Minor Version (0.X.0)**: 
  - New services added (NiFi, Registry, Elasticsearch, etc.)
  - New features that maintain backward compatibility
  - New deployment options without breaking existing ones
- **Patch Version (0.0.X)**: 
  - Bug fixes
  - Documentation updates
  - Minor improvements
  - Security patches

## Release Configuration
- **RELEASE_ARTIFACTS**: 
  - v${VERSION}/
  - docs/
  - README.md
- **ARTIFACT_COMMANDS**: 
  - `tar -czf infometis-${VERSION}.tar.gz v${VERSION}/ docs/ README.md`
  - `sha256sum infometis-${VERSION}.tar.gz > infometis-${VERSION}.tar.gz.sha256`

## Build and Test Configuration
- **BUILD_COMMANDS**: 
  - `cd v${VERSION} && node console.js` (console validation)
  - `kubectl apply --dry-run=client -f v${VERSION}/manifests/`
- **TEST_COMMANDS**: 
  - `cd v${VERSION} && node console.js` (auto mode deployment test)
  - `v${VERSION}/implementation/D3-test-nifi-ui.sh` (UI accessibility test)
- **VALIDATION_COMMANDS**: 
  - `yamllint v${VERSION}/manifests/*.yaml`
  - `shellcheck v${VERSION}/implementation/*.sh`

---

*Project Hook - Configure project version management*