# Alertmanager Component Extraction Summary

## Source Location
**Extracted from**: `/home/herma/infometish/InfoMetis/v0.5.0/`

## Extracted Assets

### 1. Kubernetes Manifests
**Source**: `config/manifests/prometheus-k8s.yaml`
**Extracted Sections**:
- Alertmanager PersistentVolume (lines 28-43)
- Alertmanager Configuration ConfigMap (lines 240-283)  
- Alertmanager Deployment (lines 456-534)
- Alertmanager Service (lines 535-553)
- Alertmanager Storage PVC (lines 554-569)

**Target**: `environments/kubernetes/manifests/alertmanager-k8s.yaml`

### 2. Image Configuration
**Source**: `config/image-config.js`
**Extracted References**:
- `prom/alertmanager:v0.25.1` (line 37)
- Related monitoring stack images

**Target**: `core/image-config.js`

### 3. Deployment Logic
**Source**: `implementation/deploy-prometheus.js`
**Extracted Patterns**:
- Image transfer to k0s containerd (lines 24-28, 93-108)
- Alertmanager deployment verification (lines 147-152, 192-198)
- Resource cleanup patterns (lines 272-277)

**Target**: `bin/deploy-alertmanager.js`

### 4. Configuration Templates
**Source**: Embedded in `prometheus-k8s.yaml` ConfigMap
**Extracted Configuration**:
- Global SMTP settings
- Route configuration with grouping rules
- Webhook receiver definitions  
- Inhibition rules for alert management

**Target**: `core/alertmanager-config.yml`

## Component Structure Created

```
alertmanager/
├── README.md                           # Component documentation
├── EXTRACTION_SUMMARY.md              # This file
├── component.yaml                      # Component specification
├── bin/
│   └── deploy-alertmanager.js         # Standalone deployment script
├── core/
│   ├── alertmanager-config.yml        # Configuration template
│   └── image-config.js                # Container configuration  
└── environments/
    └── kubernetes/
        └── manifests/
            └── alertmanager-k8s.yaml  # Kubernetes manifests
```

## Key Findings

### Image Information
- **Container Image**: `prom/alertmanager:v0.25.1`
- **Pull Policy**: `Never` (cached deployment)
- **Port**: `9093` (HTTP)
- **Health Checks**: `/-/healthy` and `/-/ready`

### Integration Points
- **Prometheus Integration**: Receives alerts from `prometheus-server-service:9090`
- **Storage**: 2Gi persistent volume at `/alertmanager`
- **Configuration**: Mounted from ConfigMap at `/etc/alertmanager/`
- **Namespace**: `infometis`

### Resource Requirements
- **CPU**: 100m request, 500m limit
- **Memory**: 128Mi request, 512Mi limit
- **Storage**: 2Gi persistent volume
- **Replicas**: 1 (single instance)

### Configuration Features
- **Routing**: Group alerts by alertname, cluster, service
- **Receivers**: Webhook-based notifications to `localhost:5001`
- **Inhibition**: Critical alerts suppress warning alerts
- **Grouping**: 10s wait time, 1h repeat interval

### Operational Features
- **High Availability**: Tolerates master/control-plane taints
- **Init Container**: Fixes permissions for alertmanager user (65534)
- **External URL**: Configured for ingress at `/alertmanager`
- **API Access**: Full REST API for programmatic management

## Notes

1. **Integrated Deployment**: Originally deployed as part of unified Prometheus stack
2. **Storage Dependencies**: Requires `local-storage` StorageClass
3. **Network Dependencies**: Expects webhook receiver at `localhost:5001`
4. **Configuration**: Default config uses webhook notifications only
5. **Monitoring Stack**: Part of complete monitoring solution with Prometheus and Node Exporter

## Validation

✅ **Container Image**: Confirmed `prom/alertmanager:v0.25.1` in source  
✅ **Kubernetes Resources**: All necessary resources extracted  
✅ **Configuration**: Complete alertmanager.yml configuration  
✅ **Dependencies**: Storage and network requirements identified  
✅ **Integration**: Prometheus-Alertmanager communication configured  
✅ **Deployment**: Standalone deployment script created  
✅ **Documentation**: Comprehensive README with usage examples

---

**Extraction completed**: All Alertmanager-related assets successfully extracted and organized into self-contained component structure.