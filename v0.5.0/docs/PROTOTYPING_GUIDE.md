# InfoMetis v0.5.0 - Prototyping Guide

> 🚀 **Hands-on guide for rapid prototyping with the InfoMetis Kafka ecosystem platform**

## Quick Start

```bash
cd /home/herma/infometish/InfoMetis/v0.5.0
node console.js
```

## 🎯 What You Can Build

InfoMetis v0.5.0 provides a complete Kafka-centric data platform for prototyping:

- **Real-time data pipelines** with NiFi + Kafka
- **Stream processing** with Flink and ksqlDB
- **Analytics dashboards** with Elasticsearch + Grafana
- **Event-driven applications** with Schema Registry
- **Performance monitoring** with Prometheus

## 📦 Component Overview

| Component | Purpose | Access URL |
|-----------|---------|------------|
| **NiFi** | Visual data flow design | http://localhost/nifi |
| **Kafka** | Event streaming backbone | http://localhost/kafka-ui |
| **Flink** | Distributed stream processing | http://localhost:8083 |
| **ksqlDB** | SQL on streams | http://localhost/ksqldb |
| **Elasticsearch** | Search and analytics | http://localhost/elasticsearch |
| **Grafana** | Dashboards | http://localhost/grafana |
| **Prometheus** | Metrics | http://localhost/prometheus |

## 🛠️ Installation Steps

### 1. Deploy the Platform

```bash
node console.js
```

Select options:
- **K** → Kubernetes Cluster → **a** (auto-execute all)
- **D** → Deployments → **a** (deploy all components)

Total deployment time: ~10-15 minutes

### 2. Verify Everything is Running

```bash
kubectl get pods -n infometis
```

All pods should show `Running` status.

## 🔥 Hands-On Tutorials

### Tutorial 1: Real-Time Data Pipeline (10 min)

**Goal**: Stream data from a REST API to Elasticsearch

1. **Access NiFi**
   ```
   http://localhost/nifi
   Username: admin
   Password: infometis2024
   ```

2. **Create a Simple Flow**
   - Drag **GenerateFlowFile** processor (generates test data)
   - Configure: Schedule = "1 sec"
   - Add **PublishKafka** processor
   - Configure: 
     - Kafka Brokers = `kafka-service:9092`
     - Topic Name = `test-events`
   - Connect processors and start flow

3. **View in Kafka UI**
   ```
   http://localhost/kafka-ui
   ```
   - Click Topics → test-events → Messages

### Tutorial 2: Stream Processing with ksqlDB (15 min)

**Goal**: Analyze streaming data with SQL

1. **Access ksqlDB CLI**
   ```bash
   kubectl exec -it -n infometis deployment/ksqldb-server -- ksql
   ```

2. **Create a Stream**
   ```sql
   CREATE STREAM test_events (
     id VARCHAR,
     timestamp BIGINT,
     value DOUBLE
   ) WITH (
     KAFKA_TOPIC='test-events',
     VALUE_FORMAT='JSON'
   );
   ```

3. **Run Continuous Query**
   ```sql
   SELECT id, 
          COUNT(*) as event_count,
          AVG(value) as avg_value
   FROM test_events
   WINDOW TUMBLING (SIZE 1 MINUTE)
   GROUP BY id
   EMIT CHANGES;
   ```

### Tutorial 3: Flink Job Deployment (20 min)

**Goal**: Deploy a streaming analytics job

1. **Access Flink UI**
   ```
   http://localhost:8083
   ```

2. **Submit Example Job**
   ```bash
   # Download example JAR
   kubectl exec -it -n infometis deployment/flink-jobmanager -- \
     wget https://repo1.maven.org/maven2/org/apache/flink/flink-examples-streaming_2.12/1.18.0/flink-examples-streaming_2.12-1.18.0-WordCount.jar

   # Submit job
   kubectl exec -it -n infometis deployment/flink-jobmanager -- \
     flink run ./flink-examples-streaming_2.12-1.18.0-WordCount.jar
   ```

3. **Monitor in UI**
   - View running jobs
   - Check task metrics
   - Explore checkpoints

### Tutorial 4: Build a Dashboard (15 min)

**Goal**: Visualize streaming metrics in Grafana

1. **Access Grafana**
   ```
   http://localhost/grafana
   Username: admin
   Password: admin (change on first login)
   ```

2. **Add Prometheus Data Source**
   - Settings → Data Sources → Add
   - Type: Prometheus
   - URL: `http://prometheus-server-service:9090`
   - Save & Test

3. **Create Dashboard**
   - Create → Dashboard → Add Panel
   - Query: `kafka_server_brokertopicmetrics_messagesin_total`
   - Visualization: Time series
   - Add more panels for different metrics

### Tutorial 5: End-to-End Pipeline (30 min)

**Goal**: Build a complete data processing pipeline

1. **Data Flow Architecture**
   ```
   REST API → NiFi → Kafka → Flink → Elasticsearch → Grafana
   ```

2. **NiFi: Ingest from API**
   - Use **GetHTTP** processor
   - URL: `https://api.github.com/events`
   - Schedule: 30 sec
   - Connect to **PublishKafka**
   - Topic: `github-events`

3. **Flink: Process Events**
   ```java
   // Create a simple Flink job to count event types
   DataStream<String> stream = env
     .addSource(new FlinkKafkaConsumer<>("github-events", ...))
     .map(event -> parseEventType(event))
     .keyBy(type -> type)
     .window(TumblingEventTimeWindows.of(Time.minutes(5)))
     .aggregate(new CountAggregator())
     .addSink(new ElasticsearchSink<>(...));
   ```

4. **Elasticsearch: Store Results**
   ```bash
   # Check data is arriving
   curl http://localhost/elasticsearch/github-stats/_search
   ```

5. **Grafana: Visualize**
   - Add Elasticsearch data source
   - Create panels for event type distribution
   - Set auto-refresh to 10s

## 🔧 Common Tasks

### Producing Test Messages to Kafka

```bash
# Using kafka-console-producer
kubectl exec -it -n infometis kafka-0 -- \
  kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic test-topic

# Type messages and press Enter
```

### Consuming Messages

```bash
kubectl exec -it -n infometis kafka-0 -- \
  kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic test-topic \
  --from-beginning
```

### Creating Kafka Topics

```bash
kubectl exec -it -n infometis kafka-0 -- \
  kafka-topics.sh \
  --create \
  --bootstrap-server localhost:9092 \
  --topic my-topic \
  --partitions 3 \
  --replication-factor 1
```

### Submitting Flink Jobs

```bash
# Copy JAR to Flink pod
kubectl cp my-job.jar infometis/flink-jobmanager-xxx:/tmp/

# Submit job
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink run /tmp/my-job.jar
```

### Querying Elasticsearch

```bash
# Search all indices
curl http://localhost/elasticsearch/_search?pretty

# Create index with mapping
curl -X PUT http://localhost/elasticsearch/my-index \
  -H 'Content-Type: application/json' \
  -d '{"mappings": {"properties": {"timestamp": {"type": "date"}}}}'
```

## 🚨 Troubleshooting

### Check Component Health

```bash
# All pods status
kubectl get pods -n infometis

# Specific component logs
kubectl logs -n infometis deployment/kafka
kubectl logs -n infometis deployment/flink-jobmanager
```

### Common Issues

1. **Kafka Connection Issues**
   - Verify service: `kubectl get svc -n infometis kafka-service`
   - Use internal DNS: `kafka-service.infometis.svc.cluster.local:9092`

2. **Flink Job Failures**
   - Check TaskManager logs: `kubectl logs -n infometis deployment/flink-taskmanager`
   - Verify checkpoint directory permissions

3. **NiFi Authorization**
   - Default credentials: admin/infometis2024
   - Registry integration pre-configured

## 🎮 Interactive Console Commands

### Deployment Operations
- **Deploy all**: `D` → `a`
- **Remove component**: `R` → select component
- **Verify health**: `V` → `1`

### Maintenance
- **Clean Docker cache**: `K` → `6`
- **Complete teardown**: `K` → `1`

## 📊 Monitoring

### Prometheus Metrics
- **Kafka**: http://localhost/prometheus → Search "kafka"
- **Flink**: Metrics available at `:9249` (configure in flink-conf.yaml)
- **Custom**: Use Prometheus client libraries

### Key Metrics to Watch
- `kafka_server_broker_topic_metrics_bytes_in_total`
- `flink_jobmanager_job_uptime`
- `elasticsearch_cluster_health_status`

## 🎯 Next Steps

1. **Explore Schema Registry**
   ```bash
   # Register a schema
   curl -X POST http://localhost/schema-registry/subjects/test-value/versions \
     -H "Content-Type: application/vnd.schemaregistry.v1+json" \
     -d '{"schema": "{\"type\": \"record\", \"name\": \"Test\", \"fields\": [{\"name\": \"id\", \"type\": \"string\"}]}"}'
   ```

2. **Build Custom Processors**
   - NiFi: Create custom processors in Java
   - Flink: Develop streaming applications
   - ksqlDB: Create UDFs

3. **Production Considerations**
   - Enable Kafka SSL/SASL
   - Configure Flink checkpointing to S3/HDFS
   - Set up Elasticsearch snapshots
   - Implement proper monitoring alerts

## 📚 Resources

- **Kafka**: https://kafka.apache.org/documentation/
- **Flink**: https://flink.apache.org/docs/
- **NiFi**: https://nifi.apache.org/docs.html
- **ksqlDB**: https://ksqldb.io/docs/
- **Elasticsearch**: https://elastic.co/guide/

---

💡 **Pro Tip**: Use the Schema Registry for data governance and evolution. It ensures compatibility across your entire streaming pipeline!