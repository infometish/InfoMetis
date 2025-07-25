# Apache NiFi - Component Guide

> 🔄 **Visual dataflow programming for data ingestion and routing**

## Quick Access

- **NiFi UI**: http://localhost/nifi
- **Credentials**: admin / infometis2024
- **Registry**: Pre-integrated at http://localhost/nifi-registry

## Getting Started

### 1. First Login
1. Navigate to http://localhost/nifi
2. Login with admin/infometis2024
3. You'll see the main canvas

### 2. Basic Flow Creation

#### Hello World Flow
1. **Drag Processor** onto canvas
2. Search for "GenerateFlowFile"
3. **Configure**:
   - Scheduling: Timer Driven, 10 sec
   - File Size: 1 KB
4. **Add Another Processor**: "LogAttribute"
5. **Connect**: Drag from GenerateFlowFile to LogAttribute
6. **Start**: Right-click → Start

### 3. Essential Processors

#### Data Ingestion
- **GetHTTP/InvokeHTTP**: REST API calls
- **GetFile**: Local file monitoring
- **ListenHTTP**: HTTP endpoint
- **ConsumeKafka**: Kafka consumer
- **GetSFTP**: Remote file transfer

#### Data Transformation
- **UpdateAttribute**: Add/modify attributes
- **JoltTransformJSON**: JSON transformation
- **ConvertRecord**: Format conversion
- **SplitJson**: JSON array splitting
- **MergeContent**: Combine flowfiles

#### Data Routing
- **RouteOnAttribute**: Conditional routing
- **RouteOnContent**: Content-based routing
- **DistributeLoad**: Load balancing
- **PublishKafka**: Send to Kafka

## Common Patterns

### Pattern 1: REST API to Kafka

```
InvokeHTTP → EvaluateJsonPath → UpdateAttribute → PublishKafka
    ↓
LogAttribute (for errors)
```

**InvokeHTTP Configuration**:
- HTTP Method: GET
- Remote URL: https://api.example.com/data
- Scheduling: 30 sec

**EvaluateJsonPath Configuration**:
- Destination: flowfile-attribute
- Add properties for each field to extract

**PublishKafka Configuration**:
- Kafka Brokers: kafka-service:9092
- Topic Name: api-events
- Use Transactions: false

### Pattern 2: File Processing Pipeline

```
GetFile → ValidateRecord → ConvertRecord → PutElasticsearchJSON
   ↓           ↓
LogAttribute  PutFile (invalid records)
```

### Pattern 3: Kafka Stream Enrichment

```
ConsumeKafka → EvaluateJsonPath → LookupRecord → UpdateRecord → PublishKafka
                                         ↓
                                  InvokeHTTP (enrichment API)
```

## Advanced Features

### 1. Process Groups
- **Create**: Right-click canvas → Create Process Group
- **Purpose**: Organize complex flows
- **Input/Output Ports**: Connect between groups

### 2. Controller Services

#### Record Processing
```
1. Create AvroSchemaRegistry controller service
2. Create JsonTreeReader with schema
3. Create JsonRecordSetWriter
4. Use with ConvertRecord processor
```

#### Database Connections
```
1. Add DBCPConnectionPool
2. Configure JDBC URL, driver, credentials
3. Use with ExecuteSQL processor
```

### 3. Variables and Parameters

#### Flow Variables
- Right-click Process Group → Variables
- Reference as `${variable_name}`
- Inherit from parent groups

#### Parameter Contexts
- Global parameters across flows
- Menu → Parameter Contexts
- Reference as `#{parameter_name}`

## NiFi + Kafka Integration

### 1. Consume from Kafka

```
Processor: ConsumeKafka_2_6
Properties:
  - Kafka Brokers: kafka-service:9092
  - Topic Name(s): my-topic
  - Group ID: nifi-consumer
  - Offset Reset: latest
  - Message Demarcator: <empty for one message per flowfile>
```

### 2. Publish to Kafka

```
Processor: PublishKafka_2_6
Properties:
  - Kafka Brokers: kafka-service:9092
  - Topic Name: ${kafka.topic}
  - Delivery Guarantee: Best Effort
  - Use Transactions: false
  - Compression Type: snappy
```

### 3. Kafka Record Processing

```
ConsumeKafkaRecord_2_6 → Process → PublishKafkaRecord_2_6

Controller Services Needed:
- JsonTreeReader
- JsonRecordSetWriter
- AvroSchemaRegistry (optional)
```

## Performance Optimization

### 1. Concurrent Tasks
- Processor → Configure → Scheduling
- Concurrent Tasks: 2-10 (based on CPU)
- Run Schedule: Adjust for throughput

### 2. Back Pressure
- Connection → Configure
- Back Pressure Object Threshold: 10,000
- Back Pressure Data Size Threshold: 1 GB

### 3. Batch Processing
- Use MergeContent before expensive operations
- Minimum Number of Entries: 1000
- Max Bin Age: 5 minutes

## Monitoring and Troubleshooting

### 1. Data Provenance
- Right-click Processor → View Data Provenance
- Track flowfile lineage
- Search by attributes

### 2. Queue Management
- Right-click Connection → List Queue
- View/download flowfiles
- Empty queue if needed

### 3. Bulletin Board
- Top menu → Bulletin Board icon
- View errors and warnings
- Filter by component

### 4. System Diagnostics
- Menu → System Diagnostics
- JVM memory usage
- Repository storage
- Active threads

## Registry Integration

### 1. Save Flow Version
1. Right-click Process Group → Version → Start Version Control
2. Registry: http://localhost/nifi-registry
3. Bucket: Create or select
4. Flow Name: Descriptive name
5. Save

### 2. Import Flow
1. Drag Process Group onto canvas
2. Choose "Import from Registry"
3. Select bucket and flow
4. Import specific version

### 3. Update Flow Version
- Right-click versioned Process Group
- Version → Commit Local Changes
- Add change comments

## Common Issues and Solutions

### 1. "Failed to send to Kafka"
```bash
# Check Kafka connectivity
kubectl exec -it -n infometis deployment/nifi -- nc -zv kafka-service 9092

# Verify topic exists
kubectl exec -it -n infometis kafka-0 -- kafka-topics.sh --list --bootstrap-server localhost:9092
```

### 2. "No available buckets"
- Check Registry is running: http://localhost/nifi-registry
- Create bucket in Registry UI first

### 3. Memory Issues
```yaml
# Increase heap in deployment
env:
  - name: NIFI_JVM_HEAP_INIT
    value: "2g"
  - name: NIFI_JVM_HEAP_MAX
    value: "4g"
```

## Best Practices

### 1. Flow Design
- **Modular**: Use Process Groups
- **Reusable**: Create templates
- **Documented**: Add labels and comments
- **Versioned**: Use Registry

### 2. Error Handling
- Always handle failure relationships
- Use retry with backoff
- Log errors for debugging
- Route failures to error queues

### 3. Security
- Change default password immediately
- Use Parameter Contexts for secrets
- Enable SSL in production
- Implement proper authorization

### 4. Performance
- Monitor queue sizes
- Set appropriate back pressure
- Use record-based processors
- Batch small files

## Example: Complete Data Pipeline

### Twitter API → Kafka → Elasticsearch

```
1. GetTwitter (or InvokeHTTP to Twitter API)
   ├─ Configure with API credentials
   └─ Schedule: 1 minute

2. EvaluateJsonPath
   ├─ Extract: $.id, $.text, $.created_at
   └─ Destination: flowfile-attributes

3. UpdateAttribute
   ├─ kafka.topic: social-media-tweets
   └─ elasticsearch.index: tweets-${now():format('yyyy.MM')}

4. PublishKafka
   ├─ Brokers: kafka-service:9092
   └─ Topic: ${kafka.topic}

5. PutElasticsearchJSON
   ├─ URL: http://elasticsearch-service:9200
   └─ Index: ${elasticsearch.index}
```

---

💡 **Pro Tips**:
- Use Process Groups for organization
- Version control everything with Registry
- Monitor data provenance for debugging
- Set up failure handling for every processor
- Use Controller Services for reusable configs