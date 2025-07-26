# ksqlDB CLI Component

The ksqlDB CLI component provides an interactive SQL interface for querying and managing Kafka streams using ksqlDB. This component deploys the Confluent ksqlDB CLI client (`confluentinc/ksqldb-cli:0.29.0`) as a Kubernetes deployment for convenient access to ksqlDB Server.

## Overview

ksqlDB CLI is a command-line client that allows you to:
- Connect to ksqlDB Server via REST API
- Execute SQL queries on Kafka streams and tables
- Create and manage streams, tables, and connectors
- Perform real-time stream processing operations
- Monitor and debug ksqlDB applications

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ksqlDB CLI    │───▶│  ksqlDB Server   │───▶│  Kafka Cluster  │
│   (Client)      │    │   (REST API)     │    │   (Streams)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Files Structure

```
ksqldb-cli/
├── README.md                           # This documentation
├── environments/
│   └── kubernetes/
│       └── manifests/
│           └── ksqldb-cli.yaml        # Kubernetes deployment manifest
├── core/
│   ├── ksqldb-cli-config.js          # Configuration settings
│   └── examples.sql                   # SQL query examples
└── bin/
    ├── deploy-ksqldb-cli.js          # Deployment automation script
    └── ksqldb-cli-helper.sh          # Utility script for common operations
```

## Quick Start

### 1. Deploy ksqlDB CLI

```bash
# Using the deployment script
cd /home/herma/infometish/InfoMetis/carambah-v0.5.0/components/ksqldb-cli
node bin/deploy-ksqldb-cli.js deploy

# Or using kubectl directly
kubectl apply -f environments/kubernetes/manifests/ksqldb-cli.yaml
```

### 2. Connect to ksqlDB

```bash
# Interactive connection
kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088

# Using the helper script
./bin/ksqldb-cli-helper.sh connect
```

### 3. Basic ksqlDB Commands

```sql
-- Show available streams
SHOW STREAMS;

-- Show available tables
SHOW TABLES;

-- Show Kafka topics
SHOW TOPICS;

-- Create a stream
CREATE STREAM users (id INT, name STRING) WITH (kafka_topic='users', value_format='JSON');

-- Query a stream
SELECT * FROM users EMIT CHANGES;
```

## Usage Examples

### Stream Creation and Querying

```sql
-- Create a stream from a Kafka topic
CREATE STREAM transactions (
    transaction_id STRING,
    user_id INT,
    amount DECIMAL(10,2),
    timestamp BIGINT
) WITH (
    kafka_topic='transactions',
    value_format='JSON'
);

-- Query the stream with filtering
SELECT user_id, amount 
FROM transactions 
WHERE amount > 100.0 
EMIT CHANGES;

-- Create an aggregated table
CREATE TABLE user_totals AS
SELECT 
    user_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM transactions
GROUP BY user_id;
```

### Real-time Analytics

```sql
-- Windowed aggregation
SELECT 
    user_id,
    COUNT(*) as txn_count,
    SUM(amount) as total_amount
FROM transactions
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id
EMIT CHANGES;
```

## Helper Script Usage

The `ksqldb-cli-helper.sh` script provides convenient commands:

```bash
# Connect interactively
./bin/ksqldb-cli-helper.sh connect

# Execute a single command
./bin/ksqldb-cli-helper.sh execute "SHOW STREAMS;"

# Show all streams
./bin/ksqldb-cli-helper.sh show-streams

# Show all tables
./bin/ksqldb-cli-helper.sh show-tables

# Test connection to ksqlDB server
./bin/ksqldb-cli-helper.sh test-connection

# Get pod logs
./bin/ksqldb-cli-helper.sh logs

# Get shell access
./bin/ksqldb-cli-helper.sh shell

# Run example operations
./bin/ksqldb-cli-helper.sh examples
```

## Configuration

### Resource Limits

The deployment is configured with:
- **CPU Limit**: 500m
- **Memory Limit**: 512Mi
- **CPU Request**: 100m
- **Memory Request**: 128Mi

### Environment Variables

- `KSQL_SERVER`: Points to ksqlDB Server service (`http://ksqldb-server-service:8088`)

## Prerequisites

Before using ksqlDB CLI, ensure:

1. **ksqlDB Server is running**: The CLI connects to ksqlDB Server
2. **Kafka cluster is available**: ksqlDB Server needs access to Kafka
3. **Schema Registry (optional)**: Required for Avro format support
4. **Kubernetes cluster**: CLI runs as a Kubernetes deployment

## Troubleshooting

### Connection Issues

```bash
# Check if ksqlDB CLI pod is running
kubectl get pods -n infometis -l app=ksqldb-cli

# Check ksqlDB Server availability
kubectl get pods -n infometis -l app=ksqldb-server

# Test connection
./bin/ksqldb-cli-helper.sh test-connection
```

### Pod Logs

```bash
# View CLI pod logs
kubectl logs -n infometis deployment/ksqldb-cli

# Follow logs in real-time
./bin/ksqldb-cli-helper.sh logs
```

### Common Errors

1. **"Could not connect to the server"**: ksqlDB Server is not running or not accessible
2. **"Topic does not exist"**: Kafka topic referenced in stream creation doesn't exist
3. **"Schema Registry not available"**: Required for Avro format operations

## Security Considerations

- The CLI runs with basic configuration suitable for development/testing
- For production use, consider:
  - Enabling authentication for ksqlDB Server
  - Using encrypted connections (HTTPS/SSL)
  - Implementing proper access controls
  - Network policies for pod-to-pod communication

## Cleanup

```bash
# Using the deployment script
node bin/deploy-ksqldb-cli.js cleanup

# Or using kubectl
kubectl delete -f environments/kubernetes/manifests/ksqldb-cli.yaml
```

## Integration with Other Components

### With ksqlDB Server
- Primary dependency - CLI connects to Server for all operations
- Server must be accessible at `http://ksqldb-server-service:8088`

### With Kafka
- Indirect relationship through ksqlDB Server
- Streams and tables are backed by Kafka topics

### With Schema Registry
- Optional integration for Avro format support
- Configure in ksqlDB Server connection

## Performance Notes

- The CLI pod is lightweight and primarily acts as a client
- Resource usage depends on query complexity and result set size
- Streaming queries keep connections open to the server
- Use `EMIT CHANGES` carefully to avoid overwhelming the client

## References

- [ksqlDB Documentation](https://ksqldb.io/docs/)
- [ksqlDB CLI Reference](https://docs.ksqldb.io/en/latest/developer-guide/ksqldb-clients/ksqldb-cli/)
- [Confluent ksqlDB CLI Docker Image](https://hub.docker.com/r/confluentinc/ksqldb-cli)
- [SQL Reference for ksqlDB](https://docs.ksqldb.io/en/latest/developer-guide/ksqldb-reference/)

---

**Component**: ksqlDB CLI  
**Image**: confluentinc/ksqldb-cli:0.29.0  
**Type**: Interactive SQL Client  
**Dependencies**: ksqlDB Server, Kafka