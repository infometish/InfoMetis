[← Back to InfoMetis Home](../README.md)

# Compositional Repository Architecture

## Overview

This document captures an architectural discussion about evolving InfoMetis and related components into a compositional repository structure where each atomic component has its own repository, and composite integrations exist as separate repositories that orchestrate multiple atomic components.

## Current State Analysis

### Existing Components
- **InfoMetis**: Container orchestration platform based on Kubernetes (k0s/kind)
- **NiFi-Automation**: NiFi pipeline management and automation toolkit

### Architectural Observation
These components represent distinct concerns:
- InfoMetis handles infrastructure and container orchestration
- NiFi-Automation handles application-specific pipeline management
- Clean separation exists with minimal coupling (mainly deployment manifests)

## Proposed Architecture

### Repository Types

#### 1. Atomic Components (Single-purpose repositories)
Each atomic component:
- Has a single, well-defined purpose
- Exposes management APIs
- Can be versioned independently
- Contains its own tests and documentation

Examples:
- `infometis` - Container orchestration platform
- `nifi-automation` - NiFi management
- `kafka-automation` - Kafka management (future)
- `spark-automation` - Spark management (future)

#### 2. Composite Components (Integration repositories)
Each composite component:
- Orchestrates multiple atomic components
- Provides higher-level abstractions
- Requires InfoMetis as foundational layer
- Adds integration-specific logic and workflows

Examples:
- `data-platform` - NiFi + Kafka + Schema Registry integration
- `ml-platform` - Spark + Model serving + Feature store integration
- `streaming-platform` - Kafka + Flink + State management integration

### Dependency Hierarchy

```
[Composite Repository]
    requires ↓
[InfoMetis] + [Atomic Component A] + [Atomic Component B] + ...
    requires ↓
[Kubernetes/Docker]
```

### API-Driven Design

Each component must expose management APIs, creating:
- **Loose Coupling**: Components interact through well-defined interfaces
- **Composability**: Mix and match components as needed
- **Automation-Friendly**: APIs enable higher-level orchestration
- **Testing**: Clear contract testing between components

API Hierarchy:
```
InfoMetis API (Platform)
    ↓
Deployment APIs (K8s manifests, configs)
    ↓
Application APIs (NiFi REST, Kafka Admin, etc.)
    ↓
Automation APIs (Pipeline management, flow orchestration)
```

## SPlectrum Integration

Using SPlectrum as the foundational API layer provides unified prerequisite and dependency management:

### Prerequisite Expression
```javascript
// Atomic component manifest
{
  "component": "nifi-automation",
  "requires": {
    "infometis": ">=0.1.0",
    "nifi": ">=1.19.0"
  },
  "provides": {
    "api": "nifi-management/v1",
    "endpoints": ["pipeline", "template", "monitoring"]
  }
}

// Composite component manifest
{
  "component": "data-platform",
  "requires": {
    "infometis": ">=0.1.0",
    "nifi-automation": ">=1.0.0",
    "kafka-automation": ">=1.0.0"
  },
  "provides": {
    "api": "unified-data-platform/v1",
    "orchestrates": ["nifi", "kafka", "schema-registry"]
  }
}
```

### SPlectrum Benefits
1. **Dependency Resolution**: Validates all prerequisites are met
2. **API Discovery**: Components register their APIs
3. **Version Compatibility**: Ensures compatible versions
4. **Service Mesh**: Routes between component APIs
5. **Configuration Management**: Unified config across components

## Key Principles

1. **Single Responsibility**: Each atomic repository has one clear purpose
2. **Explicit Prerequisites**: Dependencies are declared, not assumed
3. **API Contracts**: Components interact through versioned APIs
4. **Composability**: Complex systems built from simple components
5. **InfoMetis Foundation**: Platform layer required for all deployments

## Benefits

- **Independent Evolution**: Each component can be developed, tested, and released independently
- **Team Scalability**: Different teams can own different components
- **Clear Boundaries**: Well-defined interfaces between components
- **Reusability**: Atomic components can be used in multiple composite scenarios
- **Progressive Complexity**: Start simple, compose as needed

## Future Considerations

1. **API Gateway**: Consider unified API gateway for all components
2. **Service Discovery**: Dynamic component discovery mechanisms
3. **Configuration Distribution**: How composite configs flow to atomics
4. **Monitoring Integration**: Unified observability across components
5. **Security Model**: Authentication/authorization across API boundaries

## Conclusion

This compositional architecture aligns with InfoMetis's event-driven choreography philosophy - each component is autonomous but participates in the larger system through well-defined APIs. The architecture enables both simplicity (use just what you need) and sophistication (compose complex platforms) while maintaining clear separation of concerns.