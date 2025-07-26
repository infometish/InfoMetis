# API Server Network Proxy Agent

**Image**: `quay.io/k0sproject/apiserver-network-proxy-agent:0.0.32-k0s1`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

The API Server Network Proxy Agent provides secure tunneling between worker nodes and the Kubernetes API server. This is a **k0s-specific component** that enables secure communication in distributed clusters.

## k0s Integration

- **k0s Specific**: This is a custom k0s component, not standard Kubernetes
- **Automatic Deployment**: Deployed on worker nodes during k0s setup
- **Secure Tunneling**: Establishes secure connections to the API server
- **Version Lock**: Specifically versioned for k0s compatibility (0.0.32-k0s1)

## InfoMetis Role

Enables secure communication for:
- Worker node kubelet → API server communication
- Pod deployments and status updates
- Resource management and scheduling
- All Kubernetes API operations from worker nodes

## Technical Details

- **Version**: 0.0.32-k0s1 (k0s-specific build)
- **Network**: Establishes secure tunnels over network
- **Alternative**: Standard Kubernetes clusters may use different networking approaches
- **Security**: Provides encrypted communication channels

## References

- [Kubernetes Network Proxy](https://github.com/kubernetes-sigs/apiserver-network-proxy)
- [k0s Architecture](https://docs.k0sproject.io/v1.23.6+k0s.2/architecture/)

---

**Note**: This is a k0s-specific component automatically managed by k0s.