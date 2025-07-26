# InfoMetis Alertmanager Component

This is the **Alertmanager component** for InfoMetis v0.5.0, part of the monitoring and alerting stack. Alertmanager handles alerts sent by Prometheus server and routes them to configured notification receivers.

## Overview

**Image**: `prom/alertmanager:v0.25.1`  
**Type**: Monitoring/Alerting  
**Namespace**: `infometis`  
**Port**: `9093`

Prometheus Alertmanager is responsible for:
- Receiving alerts from Prometheus server
- Grouping and routing alerts based on configured rules
- Managing alert silences and inhibitions
- Sending notifications via various channels (webhooks, email, etc.)
- Providing a web UI for alert management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Prometheus     │───▶│   Alertmanager  │───▶│   Receivers     │
│   Server        │    │                 │    │  (webhooks,     │
│                 │    │  - Grouping     │    │   email, etc.)  │
│  - Evaluates    │    │  - Routing      │    │                 │
│    alert rules  │    │  - Silencing    │    │                 │
│  - Sends alerts │    │  - Inhibition   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Structure

```
alertmanager/
├── README.md                           # This file
├── component.yaml                      # Component specification
├── bin/
│   └── deploy-alertmanager.js         # Standalone deployment script
├── core/
│   ├── alertmanager-config.yml        # Default configuration template
│   └── image-config.js                # Container image configuration
└── environments/
    └── kubernetes/
        └── manifests/
            └── alertmanager-k8s.yaml  # Kubernetes deployment manifest
```

## Quick Start

### Deploy Alertmanager

```bash
# Using the standalone deployment script
cd bin/
node deploy-alertmanager.js deploy

# Or using kubectl directly
kubectl apply -f environments/kubernetes/manifests/alertmanager-k8s.yaml
```

### Access Alertmanager

```bash
# Via ingress (if configured)
curl http://localhost/alertmanager

# Direct access via port-forward
kubectl port-forward -n infometis service/alertmanager-service 9093:9093
curl http://localhost:9093
```

### Check Status

```bash
# Check deployment status
kubectl get deployment alertmanager -n infometis

# Check pod logs
kubectl logs -n infometis deployment/alertmanager

# Health check
curl http://localhost:9093/-/healthy
```

## Configuration

### Default Configuration

The component includes a default `alertmanager-config.yml` that provides:

- **Global settings**: SMTP configuration for email notifications
- **Routing rules**: Alert grouping and routing logic
- **Receivers**: Webhook and email notification configurations
- **Inhibition rules**: Rules to prevent alert spam

### Key Configuration Sections

#### Routing
```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
```

#### Receivers
```yaml
receivers:
- name: 'critical-alerts'
  webhook_configs:
  - url: 'http://localhost:5001/webhook/critical'
    send_resolved: true
```

#### Inhibition
```yaml
inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'cluster', 'service']
```

## Integration

### With Prometheus

Alertmanager is configured to receive alerts from Prometheus server via:

```yaml
# In Prometheus configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager-service:9093
```

### With Alert Rules

Prometheus evaluates alert rules and sends alerts to Alertmanager:

```yaml
# Example alert rule in Prometheus
- alert: HighCPUUsage
  expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage detected"
    description: "CPU usage is above 80% on {{ $labels.instance }}"
```

## Monitoring Features

### Built-in Alerts

Alertmanager receives alerts for:
- **Infrastructure**: High CPU, memory, disk usage
- **Services**: Kafka, Flink, ksqlDB, Elasticsearch availability
- **Custom metrics**: Application-specific alerts

### Notification Channels

Configured receivers include:
- **Webhooks**: HTTP endpoints for custom integrations
- **Email**: SMTP-based email notifications (configurable)
- **Slack/Teams**: Via webhook integrations (configurable)

### Alert Management

- **Grouping**: Similar alerts are grouped together
- **Silencing**: Temporarily suppress alerts during maintenance
- **Inhibition**: Prevent lower-severity alerts when critical alerts fire
- **Routing**: Route different alert types to different receivers

## API Access

Alertmanager provides a REST API for programmatic access:

```bash
# List active alerts
curl http://localhost:9093/api/v1/alerts

# Create silence
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{"matchers":[{"name":"alertname","value":"HighCPUUsage"}],"startsAt":"2024-01-01T00:00:00Z","endsAt":"2024-01-01T01:00:00Z","comment":"Maintenance window"}'

# List silences
curl http://localhost:9093/api/v1/silences
```

## Troubleshooting

### Common Issues

1. **Alertmanager not receiving alerts**
   - Check Prometheus configuration for alertmanager targets
   - Verify network connectivity between Prometheus and Alertmanager
   - Check Prometheus logs for alert delivery errors

2. **Notifications not being sent**
   - Verify receiver configuration in alertmanager.yml
   - Check webhook endpoints are accessible
   - Review Alertmanager logs for delivery errors

3. **Configuration reload issues**
   ```bash
   # Reload configuration without restart
   curl -X POST http://localhost:9093/-/reload
   
   # Or restart the pod
   kubectl rollout restart deployment/alertmanager -n infometis
   ```

### Debugging

```bash
# Check configuration validity
kubectl exec -n infometis deployment/alertmanager -- amtool config check

# View current configuration
kubectl exec -n infometis deployment/alertmanager -- amtool config show

# Check alert status
kubectl exec -n infometis deployment/alertmanager -- amtool alert query
```

## Storage

Alertmanager uses persistent storage for:
- **Alert state**: Active alerts and their status
- **Silences**: Active and expired silences
- **Notification log**: History of sent notifications

**Storage Path**: `/alertmanager`  
**Storage Size**: `2Gi`  
**Storage Class**: `local-storage`

## Security

### Network Policies

Alertmanager should be accessible by:
- Prometheus server (for receiving alerts)
- Ingress controller (for web UI access)
- Monitoring tools (for API access)

### Authentication

The default configuration does not include authentication. For production deployments, consider:
- Adding authentication via reverse proxy
- Implementing RBAC for API access
- Using TLS for encrypted communication

## Maintenance

### Backup

Important data to backup:
- Configuration files (`alertmanager.yml`)
- Alert state and silences (from `/alertmanager` volume)

### Updates

To update Alertmanager:
1. Update the image tag in `component.yaml` and manifests
2. Apply the updated manifests
3. Verify the deployment is healthy

### Cleanup

```bash
# Remove Alertmanager deployment
node bin/deploy-alertmanager.js cleanup

# Or manually
kubectl delete -f environments/kubernetes/manifests/alertmanager-k8s.yaml
```

## Dependencies

- **Prometheus Server**: Sends alerts to Alertmanager
- **Local Storage Class**: Provides persistent storage
- **Kubernetes**: Runtime environment
- **Docker**: Container runtime with cached image

## Related Components

- **prometheus**: Sends alerts to this component
- **grafana**: Uses Alertmanager as data source for alert dashboards
- **node-exporter**: Provides system metrics that trigger alerts

---

**Part of InfoMetis v0.5.0 - Composable Analytics Platform**