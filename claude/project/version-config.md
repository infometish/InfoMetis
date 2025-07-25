[← Back to Project Home](../../../README.md)

# Project Version Configuration

## Project Identity
- **PROJECT_NAME**: InfoMetis
- **ARTIFACT_NAME**: infometis-platform
- **REPOSITORY**: infometish/InfoMetis

## Version Strategy
- **CURRENT_VERSION**: 0.5.0
- **CURRENT_MILESTONE**: v0.5.0: Kafka Ecosystem Component Deployment
- **MILESTONE_NUMBER**: 5
- **VERSION_PATTERN**: semantic
- **RELEASE_TYPE**: implementation

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
- **v0.4.0**: Complete Analytics Platform (Milestone #3) - COMPLETED
- **v0.5.0**: Kafka Ecosystem Component Deployment (Milestone #5) - COMPLETED

## v0.5.0 Deliverable (COMPLETED)
- **RELEASE_NAME**: Kafka Ecosystem Platform
- **DESCRIPTION**: Complete Kafka-centric data platform with stream processing, schema management, and enhanced monitoring
- **KEY_FEATURES**:
  - Apache Flink for distributed stream processing (JobManager + TaskManager)
  - ksqlDB for SQL-based stream analytics
  - Schema Registry for schema management and evolution
  - Prometheus for comprehensive monitoring and metrics
  - Enhanced documentation with hands-on prototyping guides
  - All v0.4.0 components: NiFi, Elasticsearch, Grafana, Kafka
  - Interactive console with containerd cleanup functionality

## Completed v0.5.0 Issues
**All 24 milestone issues completed:**
1. **Flink Integration**: JobManager and TaskManager deployment with UI access
2. **ksqlDB Integration**: SQL engine for Kafka streams with CLI access
3. **Schema Registry**: Schema management service for data governance
4. **Prometheus Monitoring**: Metrics collection with PersistentVolume fixes
5. **Enhanced Console**: Added containerd cache cleanup functionality
6. **Documentation**: Comprehensive prototyping guides and component documentation
7. **Architecture**: Complete Kafka ecosystem with stream processing capabilities

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
  - v0.5.0/
  - docs/
  - README.md
- **ARTIFACT_COMMANDS**: 
  - `tar -czf infometis-0.5.0.tar.gz v0.5.0/ docs/ README.md`
  - `sha256sum infometis-0.5.0.tar.gz > infometis-0.5.0.tar.gz.sha256`

## Build and Test Configuration
- **BUILD_COMMANDS**: 
  - `cd v0.5.0 && node console.js` (console validation)
  - `kubectl apply --dry-run=client -f v0.5.0/config/manifests/`
- **TEST_COMMANDS**: 
  - `cd v0.5.0 && node console.js` (auto mode deployment test)
  - `curl -I http://localhost/nifi` (UI accessibility test)
- **VALIDATION_COMMANDS**: 
  - `find v0.5.0 -name "*.yaml" -exec yamllint {} \;`
  - `find v0.5.0 -name "*.js" -exec node -c {} \;`

---

*Project Hook - Configure project version management*