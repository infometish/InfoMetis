# InfoMetis - Event-Driven Reconciliation Design

[← Back to Home](../../README.md)

## Overview

InfoMetis implements decentralized, event-driven reconciliation where each component independently reacts to configuration changes rather than relying on central orchestration. This approach ensures eventual consistency, self-healing, and aligns with the separation of concerns principle.

## Core Principle: Configuration as Events

**Traditional Approach (Avoided):**
```
Central Orchestrator → Execute Commands → Services
```

**Event-Driven Approach (InfoMetis):**
```
Configuration Change → Service Detects → Service Reconciles
```

Each service watches its own configuration and maintains desired state independently.

## Kustomize Integration

### Configuration Structure
```
infometis/
├── core/
│   ├── services/
│   │   ├── kafka/
│   │   │   ├── deployment.yaml           # Main Kafka deployment
│   │   │   ├── reconciler-deployment.yaml # Kafka reconciler sidecar
│   │   │   ├── service.yaml
│   │   │   └── config/
│   │   │       ├── topics-config.yaml     # Desired topics state
│   │   │       └── cluster-config.yaml   # Kafka cluster settings
│   │   ├── elasticsearch/
│   │   │   ├── deployment.yaml
│   │   │   ├── reconciler-deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── config/
│   │   │       ├── indices-config.yaml    # Desired indices state
│   │   │       └── cluster-config.yaml   # ES cluster settings
│   │   └── nifi/
│   │       ├── deployment.yaml
│   │       ├── reconciler-deployment.yaml
│   │       ├── service.yaml
│   │       └── config/
│   │           ├── flows-config.yaml      # Desired flow state
│   │           └── cluster-config.yaml   # NiFi cluster settings
```

## Service Reconciliation Pattern

### Kafka Example

**1. Desired State Configuration**
```yaml
# core/services/kafka/config/topics-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kafka-topics-desired
  labels:
    infometis.component: kafka
    infometis.config-type: topics
data:
  topics.json: |
    {
      "user-events": {
        "partitions": 6,
        "replication-factor": 3,
        "config": {
          "retention.ms": "86400000"
        }
      },
      "system-logs": {
        "partitions": 3,
        "replication-factor": 2,
        "config": {
          "retention.ms": "604800000"
        }
      }
    }
```

**2. Reconciler Deployment**
```yaml
# core/services/kafka/reconciler-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-reconciler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kafka-reconciler
  template:
    spec:
      containers:
      - name: reconciler
        image: infometis/kafka-reconciler:latest
        env:
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka-service:9092"
        - name: CONFIG_MAP_NAME
          value: "kafka-topics-desired"
        - name: RECONCILE_INTERVAL
          value: "30s"
        volumeMounts:
        - name: config
          mountPath: /config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: kafka-topics-desired
```

**3. Reconciler Logic (Pseudocode)**
```python
# kafka-reconciler container logic
while True:
    desired_state = read_configmap("kafka-topics-desired")
    actual_state = get_kafka_topics()
    
    for topic in desired_state:
        if topic not in actual_state:
            create_topic(topic)
        elif actual_state[topic] != desired_state[topic]:
            update_topic(topic, desired_state[topic])
    
    for topic in actual_state:
        if topic not in desired_state:
            # Optional: delete orphaned topics
            log_warning(f"Orphaned topic: {topic}")
    
    sleep(reconcile_interval)
```

### Elasticsearch Example

**1. Desired State Configuration**
```yaml
# core/services/elasticsearch/config/indices-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: elasticsearch-indices-desired
data:
  indices.json: |
    {
      "user-profiles": {
        "settings": {
          "number_of_shards": 3,
          "number_of_replicas": 1
        },
        "mappings": {
          "properties": {
            "user_id": {"type": "keyword"},
            "email": {"type": "keyword"},
            "created_at": {"type": "date"}
          }
        }
      },
      "system-metrics": {
        "settings": {
          "number_of_shards": 1,
          "number_of_replicas": 0
        }
      }
    }
```

**2. Index Reconciler**
```yaml
# core/services/elasticsearch/reconciler-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch-reconciler
spec:
  template:
    spec:
      containers:
      - name: reconciler
        image: infometis/elasticsearch-reconciler:latest
        env:
        - name: ELASTICSEARCH_URL
          value: "http://elasticsearch-service:9200"
        - name: CONFIG_MAP_NAME
          value: "elasticsearch-indices-desired"
```

## Environment-Specific Configuration

### Development Environment
```yaml
# environments/dev/kafka-topics-override.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kafka-topics-desired
data:
  topics.json: |
    {
      "user-events": {
        "partitions": 1,        # Reduced for dev
        "replication-factor": 1  # Single replica for dev
      }
    }
```

### Production Environment
```yaml
# environments/prod/kafka-topics-override.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kafka-topics-desired
data:
  topics.json: |
    {
      "user-events": {
        "partitions": 12,       # Higher partitions for prod
        "replication-factor": 3,
        "config": {
          "min.insync.replicas": "2"  # Additional prod safety
        }
      }
    }
```

## Reconciler Container Images

### Standardized Reconciler Pattern
```dockerfile
# Base reconciler image
FROM alpine:latest
RUN apk add --no-cache python3 py3-pip curl jq
COPY reconciler-framework/ /framework/
WORKDIR /app

# Service-specific reconcilers extend base
FROM infometis/reconciler-base:latest
COPY kafka-reconciler.py /app/
COPY kafka-client-libs/ /app/libs/
CMD ["python3", "kafka-reconciler.py"]
```

### Reconciler Framework
```python
# Common reconciler framework
class ServiceReconciler:
    def __init__(self, service_name, config_map_name):
        self.service_name = service_name
        self.config_map_name = config_map_name
        
    def watch_config_changes(self):
        # Watch ConfigMap for changes
        # Call reconcile() when changes detected
        
    def reconcile(self):
        desired = self.get_desired_state()
        actual = self.get_actual_state()
        self.apply_changes(desired, actual)
        
    def get_desired_state(self):
        # Read from ConfigMap
        pass
        
    def get_actual_state(self):
        # Query service for current state
        pass
        
    def apply_changes(self, desired, actual):
        # Implement service-specific reconciliation
        pass
```

## GitOps Integration

### FluxCD Workflow
```
[Git Commit: Change kafka topics config]
  ↓
[FluxCD detects change]
  ↓
[Updates kafka-topics-desired ConfigMap]
  ↓
[Kafka reconciler detects ConfigMap change]
  ↓
[Kafka reconciler applies topic changes]
  ↓
[Kafka cluster reaches desired state]
```

### Configuration Change Flow
1. **Developer**: Updates topics configuration in Git
2. **FluxCD**: Applies new ConfigMap to cluster
3. **Reconciler**: Detects ConfigMap change (inotify/polling)
4. **Reconciler**: Reads new desired state
5. **Reconciler**: Compares with actual Kafka state
6. **Reconciler**: Creates/updates/configures topics as needed
7. **System**: Reaches eventual consistency

## Benefits

### Operational Benefits
- **Self-Healing**: Services automatically recover from configuration drift
- **Decentralized**: No single point of failure or bottleneck
- **Eventually Consistent**: System converges to desired state over time
- **Audit Trail**: All changes tracked through Git and Kubernetes events

### Development Benefits
- **Service Independence**: Each service manages its own state
- **Simple Testing**: Reconcilers can be tested independently
- **Clear Responsibility**: Each component owns its configuration domain
- **Debugging Clarity**: Issues isolated to specific service reconcilers

### Architectural Benefits
- **Separation of Concerns**: Configuration separate from reconciliation logic
- **Scalability**: Reconcilers scale independently with their services
- **Flexibility**: Different reconciliation strategies per service type
- **GitOps Compatible**: Declarative configuration fits GitOps model

## Implementation Strategy

### Phase 1: Core Service Reconcilers
- Implement Kafka topic reconciler
- Implement Elasticsearch index reconciler
- Basic reconciliation framework
- Simple configuration patterns

### Phase 2: Advanced Reconciliation
- NiFi flow reconciler
- Configuration validation and safety checks
- Reconciler health monitoring
- Error handling and alerting

### Phase 3: Enterprise Features
- Configuration change approvals
- Rollback capabilities
- Advanced monitoring and metrics
- Multi-cluster reconciliation

## Monitoring and Observability

### Reconciler Metrics
- Configuration drift detection frequency
- Reconciliation success/failure rates
- Time to reach consistency
- Configuration change audit logs

### Health Checks
- Reconciler process health
- Configuration parsing validation
- Service connectivity verification
- Desired vs actual state comparison

---

*Event-driven reconciliation design for event-driven choreography*
*Date: 2025-06-24*