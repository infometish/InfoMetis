# InfoMetis v0.1.0 - WSL NiFi Dev Platform with CAI

## Release Information
- **Version**: 0.1.0
- **Release Date**: 2025-07-10
- **Milestone**: WSL NiFi Dev Platform with CAI Automation

## Key Features
- NiFi deployment on WSL using kind (Kubernetes in Docker)
- Collaborative AI pipeline automation via REST API
- Conversational pipeline creation interface
- Operational monitoring dashboard
- Zero-install architecture for development environments

## Package Contents

### Core Platform (`infometis/`)
- **scripts/setup/**: Environment setup scripts
- **scripts/test/**: Test validation scripts
- **scripts/deploy/**: Deployment scripts
- **scripts/cai/**: CAI pipeline scripts
- **deploy/**: Kubernetes and kind configurations

### Automation Framework (`nifi-automation/`)
- **scripts/**: Pipeline creation and management
- **templates/**: Reusable pipeline configurations
- **dashboard/**: Monitoring utilities

## Quick Start
1. Run setup: `./infometis/scripts/setup/setup-cluster.sh`
2. Deploy NiFi: `./infometis/scripts/test/test-nifi-deployment.sh`
3. Access UI: http://localhost:8080/nifi

## Testing
- Full test suite: `./infometis/scripts/test/test-fresh-environment.sh`
- Individual tests available in `infometis/scripts/test/`

## Documentation
- Main documentation in parent `docs/` folder
- Component-specific guides in respective folders

---

*This version represents the foundational NiFi development platform for InfoMetis.*