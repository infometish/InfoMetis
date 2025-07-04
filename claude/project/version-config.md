[← Back to Project Home](../../../README.md)

# Project Version Configuration

## Project Identity
- **PROJECT_NAME**: InfoMetis
- **ARTIFACT_NAME**: infometis-platform
- **REPOSITORY**: SPlectrum/InfoMetis

## Version Strategy
- **CURRENT_VERSION**: 0.1.0
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

## Version Numbering Rules
- **Major Version**: Breaking changes to service interfaces or platform architecture
- **Minor Version**: New services added, significant feature additions
- **Patch Version**: Bug fixes, minor improvements, documentation updates

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