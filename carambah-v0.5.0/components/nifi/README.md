# NiFi Component - Apache NiFi (apache/nifi:1.23.2)

> Visual dataflow programming for data ingestion and routing

## Overview

This component provides Apache NiFi for the InfoMetis platform, enabling visual dataflow programming for data ingestion, transformation, and routing. NiFi offers a web-based interface for designing, monitoring, and managing data flows.

## Component Structure

```
nifi/
├── README.md                          # This file
├── bin/                              # Deployment scripts
│   └── deploy-nifi.js               # NiFi deployment automation
├── core/                            # Core libraries and configuration
│   ├── image-config.js              # Container image configuration
│   ├── docker/                      # Docker utilities
│   ├── fs/                         # File system utilities
│   ├── kubectl/                    # Kubernetes utilities
│   ├── exec.js                     # Process execution utilities
│   └── logger.js                   # Logging utilities
└── environments/
    └── kubernetes/
        └── manifests/               # Kubernetes deployment manifests
            ├── nifi-k8s.yaml       # Main NiFi deployment (StatefulSet, Service, PVC)
            ├── nifi-pv.yaml        # Persistent volumes
            └── nifi-ingress.yaml   # Traefik ingress configuration
```

## Quick Start

### 1. Deploy NiFi

```bash
cd bin/
node deploy-nifi.js
```

### 2. Access NiFi UI

- **URL**: http://localhost/nifi
- **Username**: admin
- **Password**: infometis2024

### 3. Basic Usage

1. Drag processors onto the canvas
2. Configure processor properties
3. Connect processors with relationships
4. Start the data flow

## Configuration

### Container Image
- **Image**: apache/nifi:1.23.2
- **Pull Policy**: Never (uses cached images)
- **Registry Integration**: apache/nifi-registry:1.23.2

### Storage
- **Content Repository**: 5Gi persistent storage
- **Database Repository**: 1Gi persistent storage
- **FlowFile Repository**: 2Gi persistent storage
- **Provenance Repository**: 3Gi persistent storage

### Network Access
- **Service Port**: 8080
- **Ingress Path**: /nifi
- **Registry Path**: /nifi-registry

## Key Features

- **Visual Flow Designer**: Drag-and-drop interface for building data flows
- **250+ Processors**: Pre-built components for common data operations
- **Data Provenance**: Track data lineage and flow history
- **Registry Integration**: Version control for flows and templates
- **Cluster Support**: Scale-out architecture for high throughput
- **Security**: Authentication, authorization, and encryption

## Common Processors

### Data Ingestion
- GetHTTP/InvokeHTTP - REST API calls
- GetFile - Local file monitoring
- ConsumeKafka - Kafka consumer
- GetSFTP - Remote file transfer

### Data Transformation
- UpdateAttribute - Add/modify attributes
- JoltTransformJSON - JSON transformation
- ConvertRecord - Format conversion
- SplitJson - JSON array splitting

### Data Routing
- RouteOnAttribute - Conditional routing
- PublishKafka - Send to Kafka
- PutElasticsearchJSON - Index to Elasticsearch

## Monitoring

### NiFi UI
- Data flow statistics
- Processor performance metrics
- Queue backpressure monitoring
- Error bulletins

### System Diagnostics
- JVM memory usage
- Repository storage
- Active threads
- System load

## Integration

### Kafka
- ConsumeKafka/PublishKafka processors
- Kafka brokers: kafka-service:9092
- Topic management via NiFi

### Elasticsearch
- PutElasticsearchJSON processor
- Elasticsearch URL: http://elasticsearch-service:9200
- Index pattern support

### Registry
- Flow version control
- Template sharing
- Bucket organization
- Change tracking

## Troubleshooting

### Common Issues

1. **NiFi UI not accessible**
   - Check pod status: `kubectl get pods -n infometis -l app=nifi`
   - Check ingress: `kubectl get ingress -n infometis`

2. **Storage issues**
   - Check PVC status: `kubectl get pvc -n infometis`
   - Verify host paths exist in k0s container

3. **Performance issues**
   - Monitor queue sizes in NiFi UI
   - Adjust concurrent tasks
   - Check system diagnostics

### Logs
```bash
# View NiFi logs
kubectl logs -n infometis -f statefulset/nifi

# View NiFi app logs
kubectl exec -n infometis statefulset/nifi -- tail -f /opt/nifi/nifi-current/logs/nifi-app.log
```

## Development

### Local Testing
- Port forward: `kubectl port-forward -n infometis statefulset/nifi 8080:8080`
- Direct access: http://localhost:8080/nifi

### Custom Processors
- Add custom NAR files to NiFi extensions directory
- Restart NiFi to load new processors

## References

- [Apache NiFi Documentation](https://nifi.apache.org/docs/)
- [NiFi Component Guide](../../../v0.5.0/docs/components/NIFI_GUIDE.md)
- [NiFi Registry Guide](https://nifi.apache.org/docs/nifi-registry-docs/)