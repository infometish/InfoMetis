# CoreDNS - Kubernetes DNS Server

**Image**: `coredns/coredns:1.7.1`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

CoreDNS serves as the DNS server for the Kubernetes cluster, providing:
- **Service Discovery** - DNS resolution for Kubernetes services
- **Pod Resolution** - DNS names for individual pods
- **External DNS** - Forwarding to upstream DNS servers
- **Custom DNS** - Configurable DNS policies and records

## k0s Integration

- **Automatic Deployment**: Deployed as part of k0s cluster setup
- **Configuration**: Automatically configured for cluster DNS zone
- **Service**: Runs as `kube-dns` service in `kube-system` namespace
- **ClusterIP**: Provides cluster-internal DNS at `10.96.0.10`

## InfoMetis Role

Enables service discovery for all InfoMetis components:
- `kafka-service.infometis.svc.cluster.local` → Kafka pods
- `elasticsearch-service.infometis.svc.cluster.local` → Elasticsearch pods
- `prometheus-server-service.infometis.svc.cluster.local` → Prometheus pod
- All internal service-to-service communication relies on DNS

## Examples in InfoMetis

Services use DNS names instead of IP addresses:
```yaml
# Flink connects to Kafka via DNS
KAFKA_BOOTSTRAP_SERVERS: kafka-service:9092

# Grafana connects to Prometheus via DNS  
datasource: http://prometheus-server-service:9090

# Schema Registry connects to Kafka via DNS
SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: kafka-service:9092
```

## Technical Details

- **Version**: 1.7.1 (compatible with Kubernetes v1.23.17)
- **Deployment**: 2 replicas for high availability
- **Memory Usage**: ~50MB per replica
- **DNS Zone**: `cluster.local` by default

## References

- [CoreDNS Documentation](https://coredns.io/manual/)
- [Kubernetes DNS Documentation](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)

---

**Note**: This component is automatically managed by k0s and should not be deployed manually.