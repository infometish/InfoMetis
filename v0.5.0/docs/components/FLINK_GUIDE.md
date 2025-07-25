# Apache Flink - Component Guide

> ⚡ **Distributed stream processing at scale**

## Quick Access

- **Flink UI**: http://localhost:8083
- **JobManager**: `flink-jobmanager-service:6123` (internal RPC)
- **TaskManager**: Automatically discovered

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   JobManager    │────▶│   TaskManager   │
│  (Coordinator)  │     │  (Worker Node)  │
│                 │     │                 │
│ • Job Dispatch  │     │ • Task Execution│
│ • Scheduling    │     │ • State Backend │
│ • Checkpointing │     │ • Data Processing│
└─────────────────┘     └─────────────────┘
```

## Getting Started

### 1. Access Flink UI
Navigate to http://localhost:8083
- Overview: Cluster status
- Running Jobs: Active streaming jobs
- Completed Jobs: History
- Task Managers: Worker nodes

### 2. Submit Your First Job

#### Option 1: Using Pre-built Examples
```bash
# Download example JAR
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  wget https://repo1.maven.org/maven2/org/apache/flink/flink-examples-streaming_2.12/1.18.0/flink-examples-streaming_2.12-1.18.0-WordCount.jar

# Submit job
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink run ./flink-examples-streaming_2.12-1.18.0-WordCount.jar
```

#### Option 2: Upload via UI
1. Click "Submit New Job"
2. Click "Add New" → Upload JAR
3. Select entry class
4. Set parallelism
5. Submit

### 3. Simple Kafka Word Count Job

```java
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;

public class KafkaWordCount {
    public static void main(String[] args) throws Exception {
        // Set up environment
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        
        // Kafka consumer
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "kafka-service:9092");
        properties.setProperty("group.id", "flink-word-count");
        
        FlinkKafkaConsumer<String> consumer = new FlinkKafkaConsumer<>(
            "text-input",
            new SimpleStringSchema(),
            properties
        );
        
        // Process stream
        DataStream<String> stream = env.addSource(consumer);
        
        DataStream<Tuple2<String, Integer>> wordCounts = stream
            .flatMap(new Tokenizer())
            .keyBy(value -> value.f0)
            .window(TumblingEventTimeWindows.of(Time.seconds(5)))
            .sum(1);
        
        // Print results
        wordCounts.print();
        
        // Execute
        env.execute("Kafka Word Count");
    }
}
```

## Common Patterns

### Pattern 1: Kafka to Kafka Stream Processing

```java
// Read from Kafka
FlinkKafkaConsumer<Event> kafkaSource = new FlinkKafkaConsumer<>(
    "input-events",
    new EventDeserializationSchema(),
    kafkaProperties
);

// Process
DataStream<ProcessedEvent> processed = env
    .addSource(kafkaSource)
    .map(new EventEnricher())
    .filter(event -> event.isValid())
    .keyBy(Event::getUserId)
    .window(SlidingEventTimeWindows.of(Time.minutes(10), Time.minutes(1)))
    .aggregate(new EventAggregator());

// Write to Kafka
FlinkKafkaProducer<ProcessedEvent> kafkaSink = new FlinkKafkaProducer<>(
    "output-events",
    new EventSerializationSchema(),
    kafkaProperties
);

processed.addSink(kafkaSink);
```

### Pattern 2: Complex Event Processing (CEP)

```java
import org.apache.flink.cep.CEP;
import org.apache.flink.cep.PatternStream;
import org.apache.flink.cep.pattern.Pattern;

// Define pattern
Pattern<Event, ?> pattern = Pattern.<Event>begin("first")
    .where(new SimpleCondition<Event>() {
        @Override
        public boolean filter(Event event) {
            return event.getType().equals("LOGIN");
        }
    })
    .followedBy("second")
    .where(new SimpleCondition<Event>() {
        @Override
        public boolean filter(Event event) {
            return event.getType().equals("PURCHASE");
        }
    })
    .within(Time.minutes(10));

// Apply pattern
PatternStream<Event> patternStream = CEP.pattern(eventStream, pattern);

// Process matches
DataStream<Alert> alerts = patternStream.select(
    (Map<String, List<Event>> match) -> {
        return new Alert("User made purchase within 10 min of login", match);
    }
);
```

### Pattern 3: Stateful Stream Processing

```java
public class StatefulCounter extends RichFlatMapFunction<Event, CountResult> {
    private ValueState<Long> countState;
    
    @Override
    public void open(Configuration config) {
        ValueStateDescriptor<Long> descriptor = 
            new ValueStateDescriptor<>("count", Long.class, 0L);
        countState = getRuntimeContext().getState(descriptor);
    }
    
    @Override
    public void flatMap(Event event, Collector<CountResult> out) throws Exception {
        Long currentCount = countState.value();
        currentCount += 1;
        countState.update(currentCount);
        
        if (currentCount % 1000 == 0) {
            out.collect(new CountResult(event.getKey(), currentCount));
        }
    }
}

// Use in pipeline
stream
    .keyBy(Event::getKey)
    .flatMap(new StatefulCounter())
    .print();
```

## Job Management

### Submit Job with Parameters
```bash
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink run \
    -p 4 \
    -c com.example.MyJob \
    /path/to/job.jar \
    --input kafka \
    --output elasticsearch
```

### List Running Jobs
```bash
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink list -r
```

### Cancel Job
```bash
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink cancel <job-id>
```

### Savepoint Operations
```bash
# Trigger savepoint
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink savepoint <job-id> /tmp/savepoints

# Resume from savepoint
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink run -s /tmp/savepoints/savepoint-xxxxx /path/to/job.jar
```

## Configuration

### Key Settings (flink-conf.yaml)
```yaml
# JobManager
jobmanager.memory.process.size: 1600m
jobmanager.rpc.address: flink-jobmanager-service

# TaskManager
taskmanager.memory.process.size: 1728m
taskmanager.numberOfTaskSlots: 2

# Checkpointing
execution.checkpointing.interval: 5000
execution.checkpointing.mode: EXACTLY_ONCE
state.backend: hashmap
state.checkpoints.dir: file:///tmp/flink-checkpoints

# Parallelism
parallelism.default: 2
```

### Memory Configuration
```yaml
# TaskManager Memory Breakdown
taskmanager.memory.process.size: 1728m
├── Framework Heap: 128m
├── Task Heap: 1000m
├── Network: 128m
├── Managed Memory: 400m
└── JVM Overhead: 72m
```

## Monitoring and Debugging

### 1. Flink UI Metrics
- **Overview**: Slots, running/completed jobs
- **Jobs**: Detailed job graphs, backpressure
- **Task Managers**: Memory, GC, network
- **Job Manager**: Configuration, logs

### 2. Metrics in Prometheus
```yaml
# Add to flink-conf.yaml
metrics.reporters: prometheus
metrics.reporter.prometheus.class: org.apache.flink.metrics.prometheus.PrometheusReporter
metrics.reporter.prometheus.port: 9249
```

Key metrics to monitor:
- `flink_jobmanager_job_uptime`
- `flink_jobmanager_job_numberOfFailedCheckpoints`
- `flink_taskmanager_job_task_numRecordsIn/Out`
- `flink_taskmanager_Status_JVM_Memory_Heap_Used`

### 3. Logging
```bash
# JobManager logs
kubectl logs -n infometis deployment/flink-jobmanager

# TaskManager logs
kubectl logs -n infometis deployment/flink-taskmanager

# Specific job logs
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  cat /opt/flink/log/flink-*-jobmanager-*.log
```

## Performance Tuning

### 1. Parallelism
```java
// Global
env.setParallelism(4);

// Per operator
stream
    .map(new MyMapper()).setParallelism(2)
    .keyBy(0)
    .reduce(new MyReducer()).setParallelism(4);
```

### 2. Watermarks for Event Time
```java
// Bounded out-of-orderness
env.addSource(kafkaSource)
    .assignTimestampsAndWatermarks(
        WatermarkStrategy
            .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
    );
```

### 3. State Backend for Large State
```java
// RocksDB for large state
env.setStateBackend(new EmbeddedRocksDBStateBackend());

// Configure checkpointing
env.enableCheckpointing(60000); // 1 minute
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);
env.getCheckpointConfig().setCheckpointTimeout(120000);
```

## Integration Examples

### Kafka → Flink → Elasticsearch
```java
// Source
DataStream<String> stream = env.addSource(
    new FlinkKafkaConsumer<>("events", new SimpleStringSchema(), properties)
);

// Transform
DataStream<Event> events = stream
    .map(json -> gson.fromJson(json, Event.class))
    .filter(event -> event.getValue() > 100);

// Sink to Elasticsearch
events.addSink(
    new ElasticsearchSink.Builder<>(
        httpHosts,
        new ElasticsearchSinkFunction<Event>() {
            public IndexRequest createIndexRequest(Event event) {
                return Requests.indexRequest()
                    .index("events-" + LocalDate.now())
                    .source(gson.toJson(event), XContentType.JSON);
            }
        }
    ).build()
);
```

## Troubleshooting

### Common Issues

1. **Job Fails to Start**
   ```bash
   # Check JobManager logs
   kubectl logs -n infometis deployment/flink-jobmanager --tail=50
   
   # Verify TaskManager is registered
   kubectl exec -it -n infometis deployment/flink-jobmanager -- \
     flink run -m localhost:6123 -p 1 /opt/flink/examples/streaming/WordCount.jar
   ```

2. **Checkpointing Failures**
   - Check checkpoint timeout settings
   - Verify state backend has enough space
   - Look for backpressure in UI

3. **Out of Memory**
   ```yaml
   # Increase TaskManager memory
   taskmanager.memory.process.size: 3g
   taskmanager.memory.managed.fraction: 0.4
   ```

## Best Practices

1. **Checkpointing**
   - Enable for fault tolerance
   - Use async snapshots
   - Monitor checkpoint duration

2. **Resource Planning**
   - 1 slot per CPU core
   - Leave 25% memory for OS
   - Use managed memory for batch

3. **State Management**
   - Use keyed state when possible
   - Clean up expired state
   - Consider state TTL

4. **Error Handling**
   - Implement proper deserialization error handling
   - Use side outputs for errors
   - Set restart strategies

---

💡 **Pro Tips**:
- Start with low parallelism and scale up
- Use the Flink UI to identify bottlenecks
- Enable metrics reporting for production
- Test with savepoints before upgrades
- Keep checkpoint intervals reasonable (30s-5min)