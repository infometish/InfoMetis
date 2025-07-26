# Apache Flink Component

> ⚡ **Distributed Stream Processing Engine**  
> **Version**: 1.18-scala_2.12  
> **Image**: `apache/flink:1.18-scala_2.12`

## Overview

This component provides Apache Flink as a distributed stream processing framework for real-time data analytics, event-driven applications, and complex event processing within the InfoMetis platform.

## Component Structure

```
flink/
├── README.md                           # This file
├── bin/
│   └── deploy-flink.js                 # Deployment script
├── core/                               # Core utilities and libraries
│   ├── logger.js                       # Logging utility
│   ├── exec.js                         # Command execution utility
│   ├── image-config.js                 # Container image configuration
│   ├── docker/
│   │   └── docker.js                   # Docker operations utility
│   ├── fs/
│   │   └── config.js                   # File system configuration utility
│   └── kubectl/
│       ├── kubectl.js                  # Kubernetes operations utility
│       └── templates.js                # Kubernetes template utility
├── docs/
│   └── FLINK_GUIDE.md                  # Comprehensive Flink usage guide
└── environments/
    └── kubernetes/
        └── manifests/
            ├── flink-k8s.yaml          # Main Flink deployment manifest
            └── flink-ingress.yaml      # Ingress configuration
```

## Quick Start

### 1. Deploy Flink

```bash
cd /home/herma/infometish/InfoMetis/carambah-v0.5.0/components/flink/bin
node deploy-flink.js deploy
```

### 2. Access Flink UI

- **Web UI**: http://localhost:8083
- **Direct Access**: http://localhost:8081 (requires port-forward)

### 3. Submit a Job

```bash
# Port forward to access directly
kubectl port-forward -n infometis service/flink-jobmanager-service 8081:8081

# Submit example job
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink run /opt/flink/examples/streaming/WordCount.jar
```

## Architecture

The Flink component consists of:

### JobManager
- **Role**: Cluster coordinator and job dispatcher
- **Responsibilities**: 
  - Job scheduling and resource allocation
  - Checkpoint coordination
  - Recovery management
- **Resources**: 1 CPU core, 2Gi memory
- **Ports**: 6123 (RPC), 6124 (blob), 8081 (Web UI)

### TaskManager
- **Role**: Worker nodes for task execution
- **Responsibilities**:
  - Task execution and data processing
  - State management
  - Network buffer management
- **Resources**: 1 CPU core, 2Gi memory
- **Slots**: 2 task slots per TaskManager
- **Ports**: 6122 (RPC), 6125 (query state)

### Configuration
- **State Backend**: HashMap (in-memory)
- **Checkpointing**: Enabled (5s interval, exactly-once)
- **Parallelism**: Default 2
- **Restart Strategy**: Fixed delay (3 attempts, 10s delay)

## Key Features

### Stream Processing Capabilities
- **Real-time Processing**: Low-latency stream processing
- **Event Time Processing**: Handles out-of-order events
- **Windowing**: Tumbling, sliding, and session windows
- **Complex Event Processing**: Pattern detection and matching
- **Stateful Processing**: Managed state with fault tolerance

### Fault Tolerance
- **Checkpointing**: Automatic state snapshots
- **Savepoints**: Manual state backup and migration
- **Recovery**: Automatic failover and state restoration
- **Restart Strategies**: Configurable restart behavior

### Integration
- **Kafka Integration**: Native Kafka source and sink connectors
- **Multiple Formats**: JSON, Avro, Parquet support
- **REST API**: Job submission and management
- **Metrics**: Integration with Prometheus monitoring

## Configuration Details

### Memory Configuration
```yaml
JobManager:
  Process Size: 1600m
  Heap: ~1200m
  
TaskManager:
  Process Size: 1728m
  Task Heap: 1000m
  Network Buffers: 128m
  Managed Memory: 400m
  Framework: 128m
  JVM Overhead: 72m
```

### Network Configuration
```yaml
RPC:
  JobManager: flink-jobmanager-service:6123
  TaskManager: 6122

Web UI:
  Port: 8081
  Access: /flink (via Traefik ingress)
```

### State Configuration
```yaml
Backend: HashMap
Checkpoints: file:///tmp/flink-checkpoints
Savepoints: file:///tmp/flink-savepoints
Interval: 5000ms
Mode: EXACTLY_ONCE
```

## Usage Examples

### Basic Kafka Stream Processing
```java
DataStream<String> stream = env.addSource(
    new FlinkKafkaConsumer<>("input-topic", 
        new SimpleStringSchema(), 
        properties)
);

stream
    .map(new MyTransformation())
    .addSink(new FlinkKafkaProducer<>("output-topic", 
        new SimpleStringSchema(), 
        properties));
```

### Windowed Aggregation
```java
stream
    .keyBy(Event::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new EventAggregator())
    .addSink(new MyEventSink());
```

## Management Operations

### Job Management
```bash
# List running jobs
kubectl exec -it -n infometis deployment/flink-jobmanager -- flink list

# Cancel job
kubectl exec -it -n infometis deployment/flink-jobmanager -- flink cancel <job-id>

# Create savepoint
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink savepoint <job-id> /tmp/savepoints
```

### Monitoring
```bash
# View logs
kubectl logs -n infometis deployment/flink-jobmanager
kubectl logs -n infometis deployment/flink-taskmanager

# Check cluster status
curl http://localhost:8083/overview

# List jobs via API
curl http://localhost:8083/jobs
```

### Cleanup
```bash
node deploy-flink.js cleanup
```

## Dependencies

### Runtime Dependencies
- **Apache Flink**: 1.18-scala_2.12
- **Kubernetes**: 1.23+
- **Java**: OpenJDK 11+ (included in image)

### Platform Dependencies
- **Kafka**: For stream source/sink operations
- **Traefik**: For ingress routing
- **Persistent Storage**: For checkpoints/savepoints (optional)

## Security Considerations

- **Network Isolation**: Runs in infometis namespace
- **Resource Limits**: CPU and memory limits enforced
- **Image Security**: Uses official Apache Flink image
- **Access Control**: Web UI access via Traefik ingress

## Performance Tuning

### Parallelism
- Default: 2 (matches TaskManager slots)
- Adjust based on data volume and processing requirements
- Scale TaskManager replicas for higher parallelism

### Memory
- Increase TaskManager memory for large state
- Tune managed memory fraction for batch operations
- Monitor GC metrics for heap optimization

### Checkpointing
- Balance checkpoint frequency vs. recovery time
- Use incremental checkpoints for large state
- Consider RocksDB state backend for very large state

## Troubleshooting

### Common Issues

1. **Job Submission Fails**
   - Check JobManager logs
   - Verify TaskManager registration
   - Confirm resource availability

2. **Checkpointing Failures**
   - Check storage permissions
   - Monitor checkpoint duration
   - Verify network connectivity

3. **Performance Issues**
   - Check for backpressure in Web UI
   - Monitor resource utilization
   - Review parallelism settings

### Debug Commands
```bash
# Check cluster resources
kubectl get pods -n infometis -l app.kubernetes.io/part-of=infometis

# Detailed pod information
kubectl describe pod -n infometis -l app=flink-jobmanager

# View resource usage
kubectl top pods -n infometis
```

## Related Components

- **Kafka**: Primary data source/sink
- **Schema Registry**: Schema management for structured data
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization and alerting

## Support

For detailed usage examples and advanced configurations, refer to:
- `docs/FLINK_GUIDE.md` - Comprehensive usage guide
- [Apache Flink Documentation](https://flink.apache.org/docs/stable/)
- [Flink Kubernetes Operator](https://flink.apache.org/docs/stable/deployment/resource-providers/native_kubernetes.html)