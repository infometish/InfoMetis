# Pause Container - Pod Infrastructure

**Image**: `registry.k8s.io/pause:3.5`  
**Category**: Auxiliary Image (k0s System Dependency)  
**Management**: Automatically deployed and managed by k0s

## Purpose

The pause container serves as the "pod infrastructure container" that holds Linux namespaces (Network, IPC, PID) for Kubernetes pods. It's the foundation container that other containers in a pod join.

## k0s Integration

- **Standard Kubernetes**: Core Kubernetes component (not k0s-specific)
- **Automatic Usage**: Used by kubelet for every pod created
- **Version**: 3.5 (compatible with Kubernetes v1.23.17)
- **Invisible**: Users don't directly interact with pause containers

## InfoMetis Role

Every InfoMetis pod uses a pause container:
- **Kafka pods**: Share network namespace via pause container
- **Elasticsearch pods**: Share networking and storage via pause container
- **Flink pods**: JobManager and TaskManager pods use pause containers
- **All other pods**: Every Kubernetes pod has an invisible pause container

## Technical Details

- **Size**: ~750KB (extremely lightweight)
- **Function**: Simply sleeps and holds namespaces
- **Lifecycle**: Lives as long as the pod exists
- **Visibility**: Not visible in normal pod listings
- **Networking**: Provides pod IP address and network interface

## How It Works

1. **Pod Creation**: Kubernetes creates pause container first
2. **Namespace Setup**: Pause container establishes network/IPC namespaces  
3. **Container Join**: Application containers join pause container's namespaces
4. **Shared Resources**: All containers in pod share pause container's network

## Pod Example

In a Kafka pod:
```
kafka-0 pod:
├── pause container (pause:3.5) ← Holds namespaces
├── kafka container (cp-kafka:7.5.0) ← Joins pause namespaces
└── (optional init containers also join pause namespaces)
```

## References

- [Kubernetes Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Pause Container Explained](https://www.ianlewis.org/en/almighty-pause-container)

---

**Note**: This component is automatically managed by k0s and the kubelet. It's used internally for every pod.