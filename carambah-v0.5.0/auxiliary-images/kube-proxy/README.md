# Kube-Proxy - Service Proxy

**Image**: `registry.k8s.io/kube-proxy:v1.23.17`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

Kube-proxy implements the Kubernetes Service concept by maintaining network rules on nodes. It enables service discovery and load balancing for Kubernetes services.

## k0s Integration

- **Standard Kubernetes**: Core Kubernetes component (not k0s-specific)
- **Automatic Deployment**: Deployed as DaemonSet on all cluster nodes
- **Version**: v1.23.17 (matches k0s Kubernetes version)
- **Configuration**: Automatically configured for cluster networking

## InfoMetis Role

Enables service access for all InfoMetis components:
- **Load Balancing**: Distributes traffic to backend pods
- **Service Discovery**: Routes traffic to correct service endpoints
- **ClusterIP Services**: Internal service communication
- **NodePort Services**: External service access

## Service Examples in InfoMetis

Kube-proxy manages traffic for services like:
- `kafka-service` → Kafka pods
- `elasticsearch-service` → Elasticsearch pods  
- `prometheus-server-service` → Prometheus pod
- `grafana-service` → Grafana pod

## Technical Details

- **Version**: v1.23.17 (Kubernetes standard)
- **Mode**: iptables mode (default)
- **Deployment**: DaemonSet (one per node)
- **Alternatives**: IPVS mode, eBPF-based proxies

## References

- [Kube-proxy Documentation](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-proxy/)
- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)

---

**Note**: This component is automatically managed by k0s and should not be deployed manually.