# InfoMetis - Core Architectural Principles

[← Back to Home](../../README.md)

## Fundamental Principle: Disciplined Separation of Concerns

InfoMetis is built on strict separation between internal (self-contained) and external (adaptation layer) communication. This principle is the architectural guardrail that enables roadmap-friendly development and seamless multi-environment deployment.

## Architecture Overview

```
[External Environment - Variable & Unknown]
  ↑↓ [All External Communication]
[Traefik Adaptation Layer - Environment-Specific]
  ↑↓ [Stable Internal Interface]  
[InfoMetis Core - Self-Contained & Environment-Agnostic]
```

## Internal Communication (Self-Contained)

### Scope
- **Service-to-service communication**: Kafka ↔ Elasticsearch, NiFi ↔ Kafka, etc.
- **Internal discovery and routing**: Service location and load balancing within InfoMetis
- **Internal security and authentication**: Inter-service auth, internal certificates
- **Configuration and orchestration**: Service startup, health checks, internal monitoring

### Principles
- **Environment Agnostic**: Internal services never know or care about deployment environment
- **Consistent Interface**: Same communication patterns regardless of external environment
- **Self-Sufficient**: All internal needs met within InfoMetis boundary
- **Isolation**: No direct external dependencies or environment-specific code

### Example
A Kafka instance within InfoMetis:
- Communicates with Elasticsearch via consistent internal service discovery
- Uses internal authentication mechanisms
- Receives configuration through internal config management
- **Never knows** if running in k0s, shared k8s, or any other environment

## External Communication (Adaptation Layer)

### Scope
- **All outside resource access**: External databases, APIs, file systems, message queues
- **All ingress/egress handling**: User access, external service integration
- **Environment-specific integration**: Cluster networking, existing ingress controllers
- **Compliance and security policies**: Environment-specific security requirements

### Principles
- **Environment Aware**: Adapts behavior based on deployment environment constraints
- **Transparent to Core**: Core services interact with external resources through consistent internal interfaces
- **Flexible Integration**: Can adapt to various external environment configurations
- **Boundary Enforcement**: Prevents external complexity from affecting core services

### Example
External database access in different environments:
- **Independent k0s**: Direct external connection with LoadBalancer
- **Shared k8s**: Connection through cluster-specific networking and security policies
- **Core Service View**: Same database interface regardless of actual connection method

## Implementation Strategy

### Phase 1: Self-Contained Core
**Deliverable**: InfoMetis core with basic Traefik adaptation for independent deployment
- Build and validate all internal communication patterns
- Establish internal service interfaces and contracts
- Implement basic external communication through simple adaptation layer
- **Success Criteria**: Core services work perfectly in isolation with minimal external integration

### Phase 2: Adaptation Layer Enhancement
**Deliverable**: Extended Traefik adaptation for shared cluster environments
- Add shared cluster integration capabilities
- Implement environment detection and configuration adaptation
- Maintain core service interface consistency
- **Success Criteria**: Same core services work seamlessly in shared environments

### Phase 3: Advanced Adaptation
**Deliverable**: Support for various shared cluster configurations and compliance requirements
- Multiple integration patterns for different organizational constraints
- Advanced security and compliance adaptation
- Custom environment-specific optimizations
- **Success Criteria**: InfoMetis deploys consistently across diverse enterprise environments

## Critical Success Factors

### 1. Interface Design Discipline
- **Core ↔ Adaptation boundary** must be robust and stable from day one
- No exceptions: external communication must go through adaptation layer
- Clear contracts between internal and external interfaces

### 2. Environment Abstraction
- Core services must remain truly environment-agnostic
- All environment-specific logic contained within adaptation layer
- Consistent behavior regardless of deployment mode

### 3. Configuration Management
- Template system must maintain separation of concerns
- Core configuration remains identical across environments
- Adaptation configuration handles environment-specific requirements

### 4. Testing Strategy
- Core services tested in complete isolation
- Adaptation layer tested with various environment configurations
- Integration testing validates boundary interfaces
- End-to-end testing across multiple deployment modes

## Architectural Guardrails

### What Belongs in Core
- ✅ Service-to-service communication protocols
- ✅ Internal authentication and security
- ✅ Internal configuration and orchestration
- ✅ Service business logic and functionality

### What Belongs in Adaptation Layer
- ✅ External resource connectivity
- ✅ User/client ingress handling
- ✅ Environment-specific security policies
- ✅ Integration with existing cluster infrastructure

### Prohibited Patterns
- ❌ Core services making direct external connections
- ❌ Environment-specific code within core services
- ❌ Adaptation layer logic affecting internal service behavior
- ❌ Core services aware of deployment environment details

## Validation Test

**The Kafka Test**: Can an InfoMetis Kafka instance be deployed and function identically whether running in:
- Independent k0s cluster
- Shared enterprise k8s cluster  
- Edge deployment environment
- Development laptop environment

If the Kafka instance (and all other core services) behaves identically and only the adaptation layer changes, the architectural principle is successfully implemented.

## Benefits

### Development Benefits
- **Incremental validation**: Core functionality validated independently
- **Focused development**: Team can concentrate on core value without deployment complexity
- **Simplified testing**: Core services tested in isolation
- **Clear ownership**: Distinct responsibilities between core and adaptation teams

### Deployment Benefits
- **Environment flexibility**: Same core deploys anywhere
- **Reduced complexity**: Environment-specific issues isolated to adaptation layer
- **Faster troubleshooting**: Clear boundary between internal and external issues
- **Consistent behavior**: Predictable service behavior across environments

### Maintenance Benefits
- **Upgrade safety**: Core updates don't affect environment integration
- **Environment changes**: External environment changes don't affect core services
- **Clear debugging**: Issues clearly categorized as internal or external
- **Documentation clarity**: Separate documentation for core vs adaptation concerns

---

*Core architectural principles established during preliminary discussion phase*
*Date: 2025-06-24*