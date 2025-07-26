# ksqlDB CLI Quick Reference

## Connection Commands

```bash
# Connect to ksqlDB CLI pod
kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088

# Using helper script
./bin/ksqldb-cli-helper.sh connect

# Test connection
./bin/ksqldb-cli-helper.sh test-connection
```

## Essential ksqlDB Commands

### Discovery Commands
```sql
SHOW STREAMS;                          -- List all streams
SHOW TABLES;                           -- List all tables  
SHOW TOPICS;                           -- List Kafka topics
SHOW CONNECTORS;                       -- List connectors
SHOW QUERIES;                          -- List running queries
SHOW PROPERTIES;                       -- Show server properties
```

### Stream Operations
```sql
-- Create stream
CREATE STREAM stream_name (
    field1 TYPE,
    field2 TYPE
) WITH (
    kafka_topic='topic_name',
    value_format='JSON'
);

-- Query stream
SELECT * FROM stream_name EMIT CHANGES;

-- Filtered query
SELECT field1, field2 
FROM stream_name 
WHERE condition 
EMIT CHANGES;

-- Drop stream
DROP STREAM stream_name;
```

### Table Operations
```sql
-- Create table from stream
CREATE TABLE table_name AS
SELECT field1, COUNT(*) as count
FROM stream_name
GROUP BY field1;

-- Query table
SELECT * FROM table_name;

-- Drop table
DROP TABLE table_name;
```

### Window Functions
```sql
-- Tumbling window
SELECT field1, COUNT(*)
FROM stream_name
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY field1
EMIT CHANGES;

-- Hopping window
SELECT field1, COUNT(*)
FROM stream_name
WINDOW HOPPING (SIZE 10 MINUTES, ADVANCE BY 5 MINUTES)
GROUP BY field1
EMIT CHANGES;

-- Session window
SELECT field1, COUNT(*)
FROM stream_name
WINDOW SESSION (30 SECONDS)
GROUP BY field1
EMIT CHANGES;
```

### Join Operations
```sql
-- Stream-Stream join
CREATE STREAM joined_stream AS
SELECT s1.field1, s2.field2
FROM stream1 s1
JOIN stream2 s2 WITHIN 1 HOUR
ON s1.id = s2.id;

-- Stream-Table join
CREATE STREAM enriched_stream AS
SELECT s.field1, t.field2
FROM stream_name s
LEFT JOIN table_name t
ON s.key = t.key;
```

## Data Types

| Type | Description | Example |
|------|-------------|---------|
| `BOOLEAN` | Boolean value | `true`, `false` |
| `INT` | 32-bit integer | `42` |
| `BIGINT` | 64-bit integer | `1234567890` |
| `DOUBLE` | Double precision | `3.14159` |
| `STRING` | String value | `'hello world'` |
| `DECIMAL(p,s)` | Decimal number | `DECIMAL(10,2)` |
| `ARRAY<TYPE>` | Array of type | `ARRAY<STRING>` |
| `MAP<K,V>` | Map type | `MAP<STRING, INT>` |
| `STRUCT<...>` | Structured type | `STRUCT<name STRING, age INT>` |

## Common Patterns

### Event Filtering
```sql
CREATE STREAM filtered_events AS
SELECT event_id, user_id, event_type
FROM raw_events
WHERE event_type IN ('login', 'purchase', 'click');
```

### Real-time Aggregation
```sql
CREATE TABLE user_activity AS
SELECT 
    user_id,
    COUNT(*) as event_count,
    LATEST_BY_OFFSET(event_type) as last_event
FROM events
GROUP BY user_id;
```

### Anomaly Detection
```sql
CREATE STREAM high_value_transactions AS
SELECT *
FROM transactions
WHERE amount > (
    SELECT AVG(amount) * 3 
    FROM transactions_stats
);
```

## Helper Script Commands

```bash
# Basic operations
./bin/ksqldb-cli-helper.sh show-streams
./bin/ksqldb-cli-helper.sh show-tables
./bin/ksqldb-cli-helper.sh show-topics

# Execute custom command
./bin/ksqldb-cli-helper.sh execute "DESCRIBE stream_name;"

# Describe objects
./bin/ksqldb-cli-helper.sh describe stream_name

# Examples and testing
./bin/ksqldb-cli-helper.sh examples
./bin/ksqldb-cli-helper.sh test-connection

# Pod management
./bin/ksqldb-cli-helper.sh logs
./bin/ksqldb-cli-helper.sh shell
```

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n infometis -l app=ksqldb-cli
kubectl describe pod -n infometis -l app=ksqldb-cli
```

### View Logs
```bash
kubectl logs -n infometis deployment/ksqldb-cli --tail=100
```

### Test Server Connectivity
```bash
kubectl exec -n infometis deployment/ksqldb-cli -- curl -s http://ksqldb-server-service:8088/info
```

## Performance Tips

1. **Use EMIT CHANGES sparingly** - Only for monitoring queries
2. **Limit result sets** - Use WHERE clauses to filter data
3. **Optimize joins** - Ensure proper key alignment
4. **Monitor resource usage** - Check pod memory/CPU consumption
5. **Use appropriate window sizes** - Balance latency vs. throughput

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | ksqlDB Server not running | Check server pod status |
| Topic not found | Kafka topic doesn't exist | Create topic or check name |
| Schema not found | Avro schema missing | Check Schema Registry |
| Query failed | Syntax error | Verify SQL syntax |
| Out of memory | Large result set | Add LIMIT or filter data |

## Exit Commands

```sql
-- In ksqlDB CLI
exit;
-- or --
quit;
-- or press Ctrl+D
```

```bash
# In helper script or shell
exit
# or press Ctrl+C to interrupt
```

---

For complete examples, see `core/examples.sql`  
For full documentation, see `README.md`