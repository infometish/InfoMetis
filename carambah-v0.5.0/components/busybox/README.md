# Busybox Component

The Busybox component provides a lightweight Linux toolkit (busybox:1.35) primarily used for init containers and debugging operations in the InfoMetis platform.

## Overview

Busybox is a software suite that provides several Unix utilities in a single executable file. In the InfoMetis ecosystem, it serves as the go-to solution for:

- **Init Containers**: Preparing environments before main containers start
- **Permission Fixes**: Setting correct ownership and permissions for data directories
- **Directory Setup**: Creating required directory structures
- **Debugging**: Providing a minimal environment for troubleshooting

## Image Details

- **Image**: `busybox:1.35`
- **Size**: ~4.5MB
- **Pull Policy**: `Never` (uses cached image)
- **Cached Location**: `core/busybox_1.35.tar`

## Common Usage Patterns

### Init Containers

The busybox image is extensively used as init containers across various components:

#### 1. Kafka Init Container
```yaml
initContainers:
- name: kafka-init
  image: busybox:1.35
  command: ['sh', '-c', 'mkdir -p /var/lib/kafka/data && chown -R 1000:1000 /var/lib/kafka']
  volumeMounts:
  - name: kafka-data
    mountPath: /var/lib/kafka
  securityContext:
    runAsUser: 0
```

#### 2. Elasticsearch Permission Fix
```yaml
initContainers:
- name: fix-permissions
  image: busybox:1.35
  command: ['sh', '-c', 'chown -R 1000:1000 /usr/share/elasticsearch/data']
  volumeMounts:
  - name: elasticsearch-data
    mountPath: /usr/share/elasticsearch/data
  securityContext:
    runAsUser: 0
```

#### 3. Prometheus Permission Fix
```yaml
initContainers:
- name: prometheus-data-permission-fix
  image: busybox:1.35
  command: ['chown', '-R', '65534:65534', '/prometheus']
  volumeMounts:
  - name: prometheus-storage
    mountPath: /prometheus/
  securityContext:
    runAsUser: 0
```

### Debugging

Busybox provides essential utilities for debugging container and networking issues:

```bash
# Create interactive debug pod
kubectl run busybox-debug --image=busybox:1.35 --image-pull-policy=Never --restart=Never --rm -it -- sh

# Network debugging
ping <hostname>
nslookup <hostname>
wget -q -O- <url>

# Volume inspection
ls -la /mount/path
df -h /mount/path
```

## Component Structure

```
busybox/
├── README.md                           # This file
├── component.yaml                      # Component metadata
├── bin/                               # Utility scripts
│   ├── debug-pod.sh                   # Debug pod creation utilities
│   └── init-utils.sh                  # Common init container operations
├── core/                              # Core files
│   ├── busybox_1.35.tar              # Cached Docker image
│   ├── image-config.js                # Image configuration
│   └── deployment-integration.js      # Integration utilities
└── environments/                      # Environment-specific configurations
    └── kubernetes/
        └── manifests/
            └── busybox-init.yaml      # Example init container manifests
```

## Integration with Other Components

Busybox init containers are used by the following components:

- **Kafka**: Directory creation and permission setup
- **Elasticsearch**: Data directory permission fixes
- **Prometheus**: Data directory permission setup
- **Grafana**: Data directory permission configuration
- **NiFi Registry**: Database directory setup
- **Schema Registry**: Configuration directory setup

## Utilities

### Debug Pod Script
Use `bin/debug-pod.sh` to create debug pods for troubleshooting:

```bash
# Interactive debug pod
./bin/debug-pod.sh

# Network debugging pod
./bin/debug-pod.sh network

# Volume debugging pod
./bin/debug-pod.sh volume <namespace> <pod-name> <volume-name> <mount-path>
```

### Init Utils Script
Use `bin/init-utils.sh` for common init container operations:

```bash
# Fix permissions
./bin/init-utils.sh fix_permissions /var/lib/data 1000 1000

# Setup directory structure
./bin/init-utils.sh setup_directories /data 1000 1000 logs config temp

# Wait for service
./bin/init-utils.sh wait_for_service kafka-service 9092 60
```

## Security Considerations

- Init containers run as root (UID 0) to perform permission operations
- Main containers should run as non-root users
- Volume mounts are typically required for permission operations
- Security contexts are properly configured for each use case

## Resource Requirements

- **CPU**: 10m (request) / 100m (limit)
- **Memory**: 16Mi (request) / 64Mi (limit)
- **Storage**: ~4.5MB for image

## Deployment Integration

The component includes a `deployment-integration.js` module that provides:

- Image reference management
- Init container pattern generation
- Manifest content processing
- Debug pod creation utilities

## Examples

See `environments/kubernetes/manifests/busybox-init.yaml` for comprehensive examples of:
- Permission fix patterns
- Directory setup operations
- Generic init container configurations
- Debug pod templates

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure init container runs as root (runAsUser: 0)
2. **Image Not Found**: Verify busybox:1.35 is loaded in k0s containerd
3. **Mount Failures**: Check volume mount configurations match between init and main containers

### Debug Commands

```bash
# Check if image is loaded
k0s kubectl get pods --all-namespaces | grep -i busybox

# Inspect init container logs
kubectl logs <pod-name> -c <init-container-name>

# Test busybox functionality
kubectl run test-busybox --image=busybox:1.35 --image-pull-policy=Never --restart=Never --rm -it -- sh
```

## Version Information

- **Component Version**: v0.5.0
- **Busybox Version**: 1.35
- **Platform**: linux/amd64
- **Base**: Alpine Linux