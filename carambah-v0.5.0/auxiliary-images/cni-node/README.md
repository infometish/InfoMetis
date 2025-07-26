# CNI Node Manager

**Image**: `quay.io/k0sproject/cni-node:0.1.0`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

The CNI Node Manager is a **k0s-specific component** that manages Container Network Interface (CNI) configuration and plugins on worker nodes.

## k0s Integration

- **k0s Specific**: Custom k0s component for CNI management
- **Automatic Deployment**: Deployed as DaemonSet on all nodes
- **CNI Management**: Configures and manages network plugins
- **Node Setup**: Prepares nodes for pod networking

## InfoMetis Role

Enables pod networking for all InfoMetis components:
- Pod IP address assignment
- Network namespace configuration
- Inter-pod communication setup
- Network policy enforcement preparation

## Technical Details

- **Version**: 0.1.0 (k0s-specific build)
- **Deployment**: DaemonSet (one per node)
- **CNI Plugins**: Manages CNI plugin installation and configuration
- **Alternative**: Standard Kubernetes uses different CNI management approaches

## References

- [Container Network Interface (CNI)](https://github.com/containernetworking/cni)
- [k0s Networking](https://docs.k0sproject.io/v1.23.6+k0s.2/networking/)

---

**Note**: This is a k0s-specific component automatically managed by k0s.