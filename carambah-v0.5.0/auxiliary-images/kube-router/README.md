# Kube-Router - Kubernetes Network Fabric

**Image**: `cloudnativelabs/kube-router:v1.3.2`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

Kube-router provides a comprehensive network fabric for Kubernetes clusters, combining:
- **CNI (Container Network Interface)** - Pod networking
- **Network Policies** - Traffic filtering and security
- **Service Proxy** - Load balancing and service discovery

## k0s Integration

- **Automatic Deployment**: Deployed by k0s during cluster initialization
- **Configuration**: Automatically configured for single-node k0s setup
- **Network CIDR**: Manages pod networking in the cluster subnet
- **Service Integration**: Routes traffic to InfoMetis services (kafka, elasticsearch, etc.)

## InfoMetis Role

Enables communication between InfoMetis components:
- NiFi → Kafka connections
- Flink → Kafka stream processing
- Grafana → Prometheus data queries
- All inter-service networking

## Technical Details

- **Version**: v1.3.2 (compatible with Kubernetes v1.23.17)
- **Deployment**: DaemonSet on all cluster nodes
- **Network Mode**: Host networking for direct cluster access
- **Alternative CNIs**: Could be replaced by Calico, Flannel, or Cilium

## References

- [Kube-router Documentation](https://www.kube-router.io/)
- [k0s Networking Guide](https://docs.k0sproject.io/v1.23.6+k0s.2/networking/)

---

**Note**: This component is automatically managed by k0s and should not be deployed manually.