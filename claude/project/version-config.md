[← Back to Project Home](../../../README.md)

# Project Version Configuration

## Project Identity
- **PROJECT_NAME**: InfoMetis
- **ARTIFACT_NAME**: infometis-platform
- **REPOSITORY**: SPlectrum/InfoMetis

## Version Strategy
- **CURRENT_VERSION**: 0.1.0
- **CURRENT_MILESTONE**: v0.1.0: WSL NiFi Dev Platform with CAI
- **MILESTONE_NUMBER**: 1
- **VERSION_PATTERN**: semantic
- **RELEASE_TYPE**: service

## v0.1.0 Deliverable
- **RELEASE_NAME**: WSL NiFi Dev Platform with CAI Automation
- **DESCRIPTION**: WSL-based InfoMetis NiFi development platform augmented with Collaborative AI (CAI) pipeline creation automation
- **KEY_FEATURES**:
  - NiFi deployment on WSL using kind (Kubernetes in Docker)
  - Collaborative AI pipeline automation via REST API
  - Conversational pipeline creation interface
  - Operational monitoring dashboard
  - Zero-install architecture for development environments

## GitHub Milestone Mapping
- **v0.1.0**: WSL NiFi Dev Platform with CAI (Milestone #1) - 8 open issues
- **v0.2.0**: NiFi Registry with Git Integration (Milestone #2) - 8 open issues  
- **v0.3.0**: Elasticsearch Integration (Milestone #3) - 8 open issues
- **v0.4.0**: Grafana Monitoring and Visualization (Milestone #5) - 8 open issues
- **v0.5.0**: Kafka Streaming Integration (Milestone #4) - 8 open issues

## Current Milestone Issues (v0.1.0)
**Priority order for execution:**
1. **Issue #3**: kind Cluster Setup for WSL
2. **Issue #4**: NiFi Deployment in Kubernetes  
3. **Issue #5**: Traefik Ingress for NiFi UI Access
4. **Issue #6**: Simple CAI Pipeline Integration
5. **Issue #7**: Basic User Documentation
6. **Issue #8**: Deployment Automation Script
7. **Issue #9**: End-to-End Test Suite for v0.1.0
8. **Issue #10**: Version Release Package Creation

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
  - nifi-automation/
  - docker-compose.yml
  - nifi-k8s.yaml
  - docs/
  - README.md
- **ARTIFACT_COMMANDS**: 
  - `tar -czf infometis-${VERSION}.tar.gz nifi-automation/ docker-compose.yml nifi-k8s.yaml docs/ README.md`
  - `sha256sum infometis-${VERSION}.tar.gz > infometis-${VERSION}.tar.gz.sha256`

## Build and Test Configuration
- **BUILD_COMMANDS**: 
  - `docker compose build` (if custom images needed)
  - `kubectl apply --dry-run=client -f nifi-k8s.yaml`
- **TEST_COMMANDS**: 
  - `./nifi-automation/scripts/test-deployment.sh`
  - `./nifi-automation/scripts/verify-pipeline.sh`
- **VALIDATION_COMMANDS**: 
  - `yamllint docker-compose.yml nifi-k8s.yaml`
  - `shellcheck nifi-automation/scripts/*.sh`

---

*Project Hook - Configure project version management*