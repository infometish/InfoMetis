[← Back to Project Home](../../../README.md)

# Project Version Configuration

## Project Identity
- **PROJECT_NAME**: InfoMetis
- **ARTIFACT_NAME**: infometis-platform
- **REPOSITORY**: infometish/InfoMetis

## Version Strategy
- **CURRENT_VERSION**: 0.2.0
- **CURRENT_MILESTONE**: v0.2.0: NiFi Registry with Git Integration
- **MILESTONE_NUMBER**: 2
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

## GitHub Milestone Mapping
- **v0.1.0**: k0s NiFi Platform with Console Deployment (Milestone #1) - COMPLETED
- **v0.2.0**: NiFi Registry with Git Integration (Milestone #2) - CURRENT TARGET  
- **v0.3.0**: Elasticsearch Integration (Milestone #3) - PLANNED
- **v0.4.0**: Grafana Monitoring and Visualization (Milestone #5) - PLANNED
- **v0.5.0**: Kafka Streaming Integration (Milestone #4) - PLANNED

## Current Milestone Issues (v0.2.0)
**NiFi Registry with Git Integration - Priority order for execution:**
1. **Issue #TBD**: NiFi Registry Installation and Configuration
2. **Issue #TBD**: Git Integration for Flow Versioning  
3. **Issue #TBD**: Registry UI Integration with existing console
4. **Issue #TBD**: Flow Version Management Automation
5. **Issue #TBD**: Git-based Flow Backup and Restore
6. **Issue #TBD**: Multi-environment Flow Promotion
7. **Issue #TBD**: Registry Integration Documentation
8. **Issue #TBD**: End-to-End Test Suite for v0.2.0

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