# Metrics Server - Resource Metrics

**Image**: `registry.k8s.io/metrics-server/metrics-server:v0.5.2`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

Metrics Server provides resource usage metrics (CPU, memory) for Kubernetes clusters, enabling autoscaling and resource monitoring.

## k0s Integration

- **Standard Kubernetes**: Core Kubernetes addon (not k0s-specific)
- **Automatic Deployment**: Deployed as part of k0s cluster setup
- **Version**: v0.5.2 (compatible with Kubernetes v1.23.17)
- **Configuration**: Configured for single-node k0s environment

## InfoMetis Role

Provides resource metrics for:
- **Resource Monitoring**: CPU and memory usage of InfoMetis pods
- **Autoscaling**: Foundation for Horizontal Pod Autoscaler (future)
- **Capacity Planning**: Understanding resource consumption patterns
- **Debugging**: Identifying resource-constrained components

## Resource Metrics Examples

Metrics Server enables commands like:
```bash
# Pod resource usage
kubectl top pods -n infometis

# Node resource usage  
kubectl top nodes

# Individual component monitoring
kubectl top pod kafka-0 -n infometis
kubectl top pod elasticsearch-0 -n infometis
```

## Integration with Monitoring

- **Prometheus**: Can scrape metrics-server for resource data
- **Grafana**: Can visualize resource utilization dashboards
- **Alerting**: Can alert on high resource usage

## Technical Details

- **Version**: v0.5.2 (Kubernetes standard)
- **API**: Provides metrics.k8s.io/v1beta1 API
- **Deployment**: Single replica deployment
- **Memory Usage**: ~50MB typically

## References

- [Metrics Server Documentation](https://github.com/kubernetes-sigs/metrics-server)
- [Kubernetes Metrics APIs](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-metrics-pipeline/)

---

**Note**: This component is automatically managed by k0s and should not be deployed manually.