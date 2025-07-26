# Auxiliary Images - k0s System Dependencies

This directory contains visibility entries for the **k0s system images** that are automatically managed by the Kubernetes distribution but are part of the InfoMetis v0.5.0 platform.

## Overview

These 7 auxiliary images are **automatically deployed and managed by k0s** and are not directly user-deployable. They provide essential Kubernetes infrastructure services that support the application components.

## Auxiliary Images (7)

| Component | Image | Version | Purpose |
|-----------|-------|---------|---------|
| **kube-router** | `cloudnativelabs/kube-router` | v1.3.2 | Network fabric (CNI, policies, service proxy) |
| **coredns** | `coredns/coredns` | 1.7.1 | DNS server for service discovery |
| **apiserver-network-proxy-agent** | `quay.io/k0sproject/apiserver-network-proxy-agent` | 0.0.32-k0s1 | Secure tunneling (k0s-specific) |
| **cni-node** | `quay.io/k0sproject/cni-node` | 0.1.0 | CNI management on nodes (k0s-specific) |
| **kube-proxy** | `registry.k8s.io/kube-proxy` | v1.23.17 | Service proxy and load balancing |
| **metrics-server** | `registry.k8s.io/metrics-server/metrics-server` | v0.5.2 | Resource metrics for autoscaling |
| **pause** | `registry.k8s.io/pause` | 3.5 | Pod infrastructure container |

## Architecture Role

These auxiliary images form the **Kubernetes system layer** that supports the InfoMetis application components:

```
┌─────────────────────────────────────────┐
│        InfoMetis Application Layer      │
│   (17 Components - User Deployable)     │
├─────────────────────────────────────────┤
│         k0s System Layer                │
│    (7 Auxiliary Images - Auto-Managed)  │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│       (Host OS, Container Runtime)      │
└─────────────────────────────────────────┘
```

## Management

- **Automatically Deployed**: These images are deployed by k0s during cluster initialization
- **Version Locked**: Versions are tied to k0s Kubernetes v1.23.17 
- **No User Intervention**: These components should not be manually deployed or modified
- **k0s Responsibility**: Lifecycle management handled entirely by k0s

## Integration with InfoMetis

While these images are not directly deployable, they provide essential services:

- **Networking**: kube-router enables pod-to-pod communication
- **DNS**: coredns enables service discovery (`kafka-service`, `elasticsearch-service`, etc.)
- **Metrics**: metrics-server provides resource data for monitoring
- **Security**: Network proxy agents secure internal communications
- **Runtime**: pause containers manage pod lifecycle

## Caching Considerations

These images are included in InfoMetis v0.5.0 image caching:
- Pre-cached for offline deployment scenarios
- Automatically imported by k0s during cluster setup
- No manual image management required

## Documentation

Each auxiliary image has its own directory with detailed documentation about:
- Technical purpose and functionality
- k0s integration specifics
- Version compatibility information
- External resources for deeper understanding

---

**Note**: These auxiliary images provide visibility into k0s system dependencies but are **not intended for direct user deployment**. They are automatically managed by the k0s Kubernetes distribution.