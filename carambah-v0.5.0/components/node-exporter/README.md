# Node Exporter Component

The Node Exporter component provides system-level metrics collection for the InfoMetis platform. It deploys the Prometheus Node Exporter (`prom/node-exporter:v1.6.1`) as a DaemonSet to collect hardware and OS metrics from all cluster nodes.

## Overview

Node Exporter is a Prometheus exporter for hardware and OS metrics exposed by *NIX kernels. It runs on each node in the cluster and exposes system metrics such as CPU usage, memory consumption, disk I/O, network statistics, and more.

## Features

- **System Metrics Collection**: Collects comprehensive system metrics from all cluster nodes
- **DaemonSet Deployment**: Automatically deploys to all nodes including master/control-plane nodes
- **Prometheus Integration**: Ready for Prometheus scraping with service discovery
- **Resource Efficient**: Minimal resource footprint (100m CPU, 100Mi memory requests)
- **Host System Access**: Safely accesses host filesystems, proc, and sys for accurate metrics

## Architecture

```
┌─────────────────────────────────────────────┐
│                Node Exporter                │
├─────────────────────────────────────────────┤
│ • System metrics collection                 │
│ • Hardware monitoring                       │
│ • OS-level statistics                       │
│ • Network interface metrics                 │
│ • Filesystem usage data                     │
└─────────────────────────────────────────────┘
                     │
                     │ :9100/metrics
                     ▼
┌─────────────────────────────────────────────┐
│              Prometheus                     │
│         (metrics scraping)                  │
└─────────────────────────────────────────────┘
```

## Deployment

### Standalone Deployment

```bash
# Deploy Node Exporter
node bin/deploy-node-exporter.js deploy

# Clean up Node Exporter
node bin/deploy-node-exporter.js cleanup
```

### Manual Kubernetes Deployment

```bash
# Apply the manifest
kubectl apply -f environments/kubernetes/manifests/node-exporter.yaml

# Check DaemonSet status
kubectl get daemonset node-exporter -n infometis

# Check pods on all nodes
kubectl get pods -n infometis -l app=node-exporter -o wide
```

## Configuration

### Resource Requirements

- **CPU**: 100m request, 200m limit
- **Memory**: 100Mi request, 200Mi limit
- **Storage**: No persistent storage required

### Network Configuration

- **Port**: 9100 (metrics endpoint)
- **Protocol**: HTTP
- **Service**: ClusterIP (node-exporter-service)

### Host Access

Node Exporter requires host-level access to collect system metrics:

- **Host Network**: Enabled for accurate network metrics
- **Host PID**: Enabled for process metrics
- **Volume Mounts**:
  - `/proc` → `/host/proc` (process information)
  - `/sys` → `/host/sys` (system information)
  - `/` → `/host/root` (filesystem information)

## Metrics

### Key Metric Categories

#### CPU Metrics
- `node_cpu_seconds_total`: CPU time spent in different modes
- `node_load1`, `node_load5`, `node_load15`: System load averages

#### Memory Metrics
- `node_memory_MemTotal_bytes`: Total system memory
- `node_memory_MemAvailable_bytes`: Available memory
- `node_memory_Buffers_bytes`: Buffer memory
- `node_memory_Cached_bytes`: Cache memory

#### Disk Metrics
- `node_filesystem_size_bytes`: Filesystem size
- `node_filesystem_avail_bytes`: Available filesystem space
- `node_disk_io_time_seconds_total`: Disk I/O time
- `node_disk_reads_completed_total`: Completed disk reads

#### Network Metrics
- `node_network_receive_bytes_total`: Network bytes received
- `node_network_transmit_bytes_total`: Network bytes transmitted
- `node_network_receive_packets_total`: Network packets received
- `node_network_transmit_packets_total`: Network packets transmitted

#### System Metrics
- `node_boot_time_seconds`: System boot time
- `node_time_seconds`: Current system time
- `node_uname_info`: System information

## Prometheus Integration

### Scrape Configuration

Add to Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_endpoints_name]
        action: keep
        regex: node-exporter-service
      - source_labels: [__meta_kubernetes_endpoint_port_name]
        action: keep
        regex: metrics
```

### Common Queries

```promql
# CPU usage percentage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage percentage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Network traffic rate
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
```

## Monitoring and Alerting

### Sample Alert Rules

```yaml
- alert: HighCPUUsage
  expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage detected"
    description: "CPU usage is above 80% on {{ $labels.instance }}"

- alert: HighMemoryUsage
  expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage detected"
    description: "Memory usage is above 85% on {{ $labels.instance }}"

- alert: DiskSpaceLow
  expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 85
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Low disk space"
    description: "Disk usage is above 85% on {{ $labels.instance }}"
```

## Troubleshooting

### Common Issues

#### DaemonSet Not Scheduling on All Nodes
```bash
# Check node taints and tolerations
kubectl describe nodes

# Check DaemonSet status
kubectl describe daemonset node-exporter -n infometis
```

#### Metrics Not Available
```bash
# Check pod logs
kubectl logs -n infometis -l app=node-exporter

# Test metrics endpoint
kubectl port-forward -n infometis daemonset/node-exporter 9100:9100
curl http://localhost:9100/metrics
```

#### Permission Issues
```bash
# Verify host path mounts
kubectl exec -n infometis -l app=node-exporter -- ls -la /host/proc
kubectl exec -n infometis -l app=node-exporter -- ls -la /host/sys
```

### Debug Commands

```bash
# Check DaemonSet status
kubectl get daemonset node-exporter -n infometis -o wide

# View pod distribution
kubectl get pods -n infometis -l app=node-exporter -o wide

# Check service endpoints
kubectl get endpoints node-exporter-service -n infometis

# Port forward for local testing
kubectl port-forward -n infometis daemonset/node-exporter 9100:9100
```

## Security Considerations

- **Host Access**: Node Exporter requires privileged access to host systems
- **Network Policy**: Consider implementing network policies to restrict access
- **RBAC**: No special Kubernetes RBAC permissions required
- **Metrics Sensitivity**: Some metrics may contain sensitive system information

## Integration with InfoMetis

Node Exporter integrates seamlessly with the InfoMetis monitoring stack:

- **Prometheus**: Automatic service discovery and scraping
- **Grafana**: Pre-built dashboards for system metrics visualization
- **Alertmanager**: Alert routing for system-level alerts
- **InfoMetis Platform**: Provides infrastructure monitoring for all components

## File Structure

```
node-exporter/
├── README.md                           # This documentation
├── component.yaml                      # Component configuration
├── bin/
│   └── deploy-node-exporter.js        # Deployment script
├── core/
│   └── node-exporter-config.yaml      # Core configuration
└── environments/
    └── kubernetes/
        └── manifests/
            └── node-exporter.yaml     # Kubernetes manifests
```

## Version Information

- **Node Exporter Version**: v1.6.1
- **InfoMetis Version**: v0.5.0
- **Kubernetes Compatibility**: v1.20+
- **Prometheus Compatibility**: v2.0+