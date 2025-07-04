[← Back to NiFi WSL Dev Platform](./README.md)

# NiFi WSL Dev Platform Roadmap

## Overview

Roadmap for InfoMetis NiFi development platform on WSL, progressing from basic deployment to full collaborative AI integration.

## Release Progression

### v0.1.0: WSL NiFi Foundation with Simple CAI ✅ Current
**Deliverable**: WSL-based NiFi deployment with simple CAI pipeline support and complete user documentation

**Key Components**:
- **Core Service**: NiFi deployment on WSL using kind (Kubernetes in Docker)
- **CAI Integration**: Simple collaborative AI pipeline creation support
- **Documentation**: Complete user setup and operation guides
- **Zero-Install**: Development-ready architecture

**Pipeline Automation**: Basic conversational pipeline creation

**Status**: In development

### v0.2.0: + NiFi Registry with Git Integration
**Deliverable**: Add NiFi Registry with Git version control integration

**Key Components**:
- **New Service**: NiFi Registry for pipeline version control
- **Git Integration**: Pipeline versioning and backup to Git repositories
- **Enhanced CAI**: Pipeline version management through AI interface

**Pipeline Automation**: Version-controlled pipeline creation and management

**Dependencies**: v0.1.0 completion

### v0.3.0: + Elasticsearch
**Deliverable**: Add Elasticsearch for search and analytics

**Key Components**:
- **New Service**: Elasticsearch deployment and integration
- **Data Integration**: NiFi → Elasticsearch data flows
- **Enhanced CAI**: Search and analytics pipeline creation

**Pipeline Automation**: Data indexing and search pipeline patterns

**Dependencies**: v0.2.0 completion

### v0.4.0: + Grafana
**Deliverable**: Add Grafana for monitoring and visualization

**Key Components**:
- **New Service**: Grafana deployment and integration
- **Monitoring Integration**: NiFi + Elasticsearch → Grafana dashboards
- **Enhanced CAI**: Dashboard and monitoring pipeline creation

**Pipeline Automation**: Automated monitoring and alerting pipeline patterns

**Dependencies**: v0.3.0 completion

### v0.5.0: + Kafka
**Deliverable**: Add Kafka for message streaming

**Key Components**:
- **New Service**: Kafka deployment and integration
- **Streaming Integration**: Kafka → NiFi → Elasticsearch → Grafana flows
- **Enhanced CAI**: Event-driven pipeline creation

**Pipeline Automation**: Real-time streaming and event processing patterns

**Dependencies**: v0.4.0 completion

### Future Versions
**Approach**: Following PRINCE2 "just enough planning" principles, versions beyond v0.5.0 will be planned as requirements become clearer through implementation experience.


## Strategic Alignment

This roadmap aligns with InfoMetis core architectural principles:
- **Single Concern Pattern**: Each version focuses on specific capability expansion
- **Internal Simplicity**: Development environment remains simple and accessible
- **Border Complexity**: Advanced features managed at platform boundary
- **Template-Based Configuration**: Consistent patterns across all versions

## Development Approach

- **Phase-Based Development**: Each version broken into manageable phases
- **Test-Driven Development**: TDD from ground up across all versions
- **Iterative Enhancement**: Each version builds incrementally on previous
- **User-Driven Design**: CAI integration guides feature development

---

*NiFi WSL Development Platform Roadmap - InfoMetis Service Orchestration Platform*