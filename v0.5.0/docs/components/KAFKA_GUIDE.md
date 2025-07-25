# Apache Kafka - Component Guide

> 📨 **The heart of InfoMetis - distributed event streaming**

## Quick Access

- **Kafka UI**: http://localhost/kafka-ui
- **Bootstrap Server**: `kafka-service:9092` (internal)
- **Namespace**: `infometis`

## Common Operations

### 1. Topic Management

#### Create Topic
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-topics.sh \
  --create \
  --bootstrap-server localhost:9092 \
  --topic my-events \
  --partitions 3 \
  --replication-factor 1
```

#### List Topics
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-topics.sh \
  --list \
  --bootstrap-server localhost:9092
```

#### Describe Topic
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-topics.sh \
  --describe \
  --bootstrap-server localhost:9092 \
  --topic my-events
```

#### Delete Topic
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-topics.sh \
  --delete \
  --bootstrap-server localhost:9092 \
  --topic my-events
```

### 2. Producing Messages

#### Console Producer
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic my-events
```

#### With Key-Value
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic my-events \
  --property "parse.key=true" \
  --property "key.separator=:"
```
Type: `key1:{"message": "Hello Kafka"}`

#### From File
```bash
kubectl exec -i -n infometis kafka-0 -- kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic my-events < messages.txt
```

### 3. Consuming Messages

#### From Beginning
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic my-events \
  --from-beginning
```

#### With Consumer Group
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic my-events \
  --group my-consumer-group
```

#### Show Keys and Values
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic my-events \
  --property print.key=true \
  --property key.separator=":"
```

### 4. Consumer Group Management

#### List Consumer Groups
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --list
```

#### Describe Group
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group my-consumer-group
```

#### Reset Offsets
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group my-consumer-group \
  --reset-offsets \
  --to-earliest \
  --topic my-events \
  --execute
```

## Configuration

### Key Settings (server.properties)
```properties
# KRaft Mode (no ZooKeeper)
process.roles=broker,controller
controller.quorum.voters=1@kafka-0:9093

# Storage
log.dirs=/var/lib/kafka/data
log.retention.hours=168
log.segment.bytes=1073741824

# Network
listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
inter.broker.listener.name=PLAINTEXT

# Topics
auto.create.topics.enable=true
num.partitions=1
default.replication.factor=1
```

### Performance Tuning

#### Producer Performance
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-producer-perf-test.sh \
  --topic perf-test \
  --num-records 100000 \
  --record-size 1000 \
  --throughput 10000 \
  --producer-props bootstrap.servers=localhost:9092
```

#### Consumer Performance
```bash
kubectl exec -it -n infometis kafka-0 -- kafka-consumer-perf-test.sh \
  --bootstrap-server localhost:9092 \
  --topic perf-test \
  --messages 100000
```

## Integration Examples

### 1. NiFi → Kafka

In NiFi, use **PublishKafka** processor:
```
Kafka Brokers: kafka-service:9092
Topic Name: nifi-events
Security Protocol: PLAINTEXT
```

### 2. Kafka → Flink

```java
Properties properties = new Properties();
properties.setProperty("bootstrap.servers", "kafka-service:9092");
properties.setProperty("group.id", "flink-consumer");

FlinkKafkaConsumer<String> consumer = new FlinkKafkaConsumer<>(
    "my-events",
    new SimpleStringSchema(),
    properties
);

DataStream<String> stream = env.addSource(consumer);
```

### 3. Kafka → ksqlDB

```sql
CREATE STREAM my_stream (
  id VARCHAR,
  timestamp BIGINT,
  data VARCHAR
) WITH (
  KAFKA_TOPIC='my-events',
  VALUE_FORMAT='JSON'
);
```

### 4. Kafka → Elasticsearch (using Kafka Connect)

```json
{
  "name": "elasticsearch-sink",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "topics": "my-events",
    "connection.url": "http://elasticsearch-service:9200",
    "type.name": "_doc",
    "key.ignore": "true",
    "schema.ignore": "true"
  }
}
```

## Monitoring

### Key Metrics
- **Messages In Rate**: `kafka_server_brokertopicmetrics_messagesinpersec`
- **Bytes In/Out**: `kafka_server_brokertopicmetrics_bytesin/outpersec`
- **ISR Shrinks**: `kafka_server_replicamanager_isrshrinksrate`
- **Consumer Lag**: Check via consumer groups

### Using Kafka UI
1. Navigate to http://localhost/kafka-ui
2. View:
   - Brokers health
   - Topic statistics
   - Consumer group lag
   - Message browsing

## Troubleshooting

### Check Kafka Logs
```bash
kubectl logs -n infometis kafka-0 --tail=100
```

### Common Issues

1. **Cannot produce/consume messages**
   ```bash
   # Test connectivity
   kubectl exec -it -n infometis kafka-0 -- nc -zv localhost 9092
   ```

2. **Topic not found**
   ```bash
   # Enable auto-creation or create manually
   kubectl exec -it -n infometis kafka-0 -- kafka-topics.sh \
     --create --topic test --bootstrap-server localhost:9092
   ```

3. **Storage full**
   ```bash
   # Check disk usage
   kubectl exec -it -n infometis kafka-0 -- df -h /var/lib/kafka/data
   
   # Reduce retention
   kubectl exec -it -n infometis kafka-0 -- kafka-configs.sh \
     --bootstrap-server localhost:9092 \
     --entity-type topics --entity-name my-events \
     --alter --add-config retention.ms=3600000
   ```

## Best Practices

1. **Topic Naming**: Use descriptive names with namespaces
   - Good: `orders.created`, `user.profile.updated`
   - Bad: `topic1`, `test`

2. **Partition Strategy**: 
   - Start with 3 partitions for most topics
   - Use power of 2 for easier scaling

3. **Message Format**:
   - Use Schema Registry for production
   - Include timestamp and version in messages

4. **Consumer Groups**:
   - One group per application instance
   - Descriptive names: `analytics-processor`, `email-sender`

## Advanced Usage

### Multi-DC Replication (MirrorMaker 2)
```bash
# Create mm2.properties file first
kubectl exec -it -n infometis kafka-0 -- \
  connect-mirror-maker.sh mm2.properties
```

### Exactly-Once Semantics
```properties
# Producer config
enable.idempotence=true
transactional.id=my-transactional-producer

# Consumer config  
isolation.level=read_committed
```

---

💡 **Pro Tips**:
- Use Kafka UI for visual management
- Set up alerts for consumer lag
- Plan partition count for expected throughput
- Use compression for high-volume topics