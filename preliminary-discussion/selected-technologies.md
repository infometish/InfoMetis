# InfoMetis - Selected Technologies

## Overview

This document tracks the specific technologies and components selected for InfoMetis implementation, organized by functional area and responsibility.

## Core Platform Technologies

### Container Orchestration
- **k0s**: Lightweight Kubernetes distribution
  - Minimal footprint and operational overhead
  - Production-ready Kubernetes without complexity
  - Suitable for edge and simplified deployments

### Networking & Ingress
- **Traefik**: Edge router and reverse proxy
  - HTTP/HTTPS routing and load balancing
  - Automatic service discovery
  - SSL/TLS certificate management (Let's Encrypt integration)
  - Authentication and authorization middleware
  - Single component handling multiple border concerns

## Technologies Under Consideration

### Internal Networking
**Two options under consideration pending organizational constraints:**

**Option A: k0s Native Networking**
- Kubernetes namespaces and network policies
- Namespaces for component set segregation
- Network policies for inter-namespace communication rules
- Built-in service discovery, minimal additional components

**Option B: Traefik Internal Routing**
- Single Traefik instance handling both border and internal routing
- Consistent configuration approach across all networking
- Service discovery and inter-network rules via Traefik
- May be necessary if k8s network policy configuration is restricted

### Configuration Management
- **Kustomize + FluxCD**: YAML-based configuration with GitOps deployment
  - Team already experienced with Kustomize
  - Natural environment abstraction via overlays  
  - Perfect fit for core/adaptations/environments structure
  - FluxCD provides continuous deployment and reconciliation

### Internal Network Encryption
- *Transport layer encryption approach*
- Options: Wireguard, Istio mTLS, native k0s security

### Service Examples (Internal)
- **Kafka**: Message streaming
- **Elasticsearch**: Search and analytics  
- **NiFi**: Data flow processing

## Technology Selection Criteria

### Single Concern Principle
- Each technology should have a clear primary responsibility
- Technologies can handle multiple related concerns (like Traefik)
- Avoid overlap and complexity

### Simplicity First
- Minimal operational overhead
- Clear configuration and management
- Suitable for multiple environments (dev/uat/prod)

### Border Complexity Model
- Complex features implemented at platform boundary
- Internal services remain simple and focused
- External interaction complexity abstracted

## Decision Status

✅ **Confirmed**
- k0s for container orchestration (with k8s compatibility maintained)
- Traefik for ingress/routing/auth/certificates

✅ **Confirmed**
- **FluxCD + Kustomize**: GitOps deployment with existing team expertise
- **Event-driven reconciliation**: Decentralized orchestration via configuration-as-events

🔄 **Under Discussion**
- Internal networking approach (pending organizational k8s constraints)

⏭️ **Deferred (Production Requirements)**
- Internal transport encryption method
- Service mesh necessity

❓ **To Be Determined**
- Monitoring and observability stack
- Logging aggregation
- Secret management
- CI/CD integration approach

---

*Technology selection tracking during preliminary discussion phase*
*Date: 2025-06-24*