# NiFi Pipeline Creation via REST API

## Overview

This document details the programmatic creation of a NiFi file processing pipeline using the REST API, demonstrating how to automate pipeline deployment without manual UI interaction.

## Authentication Process

### 1. Obtain Bearer Token
```bash
TOKEN=$(curl -k -X POST \
  'https://localhost:8443/nifi-api/access/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=adminpassword')
```

**Response**: JWT token for subsequent API calls
```
eyJraWQiOiI0YjYyODI1YS0wNGE1LTQ1OTgtYTEzOS1hNWIzZGM3NjI3YmQiLCJhbGciOiJFZERTQSJ9...
```

### 2. Get Root Process Group ID
```bash
curl -k -H "Authorization: Bearer $TOKEN" \
  https://localhost:8443/nifi-api/flow/process-groups/root
```

**Key Response**: `"id":"b32f6c3b-0197-1000-4318-c3a2e80543ab"`

## Pipeline Architecture

```
[Input Directory] → [GetFile] → [Connection] → [PutFile] → [Output Directory]
     ↓                 ↓             ↓           ↓              ↓
/opt/nifi/input    File Reader   success    File Writer   /opt/nifi/output
```

## Step-by-Step Creation

### 1. Create GetFile Processor
```bash
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.GetFile",
      "position": {"x": 100, "y": 100}
    }
  }'
```

**Result**: Processor ID `b33330eb-0197-1000-3dec-43b3c6692d3f`

### 2. Configure GetFile Input Directory
```bash
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 1},
    "component": {
      "id": "'$GETFILE_ID'",
      "config": {
        "properties": {
          "Input Directory": "/opt/nifi/input"
        }
      }
    }
  }'
```

### 3. Create PutFile Processor
```bash
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.PutFile",
      "position": {"x": 400, "y": 100}
    }
  }'
```

**Result**: Processor ID `b3338913-0197-1000-ba69-7ce8eaae7f5a`

### 4. Configure PutFile Output Directory
```bash
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$PUTFILE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 1},
    "component": {
      "id": "'$PUTFILE_ID'",
      "config": {
        "properties": {
          "Directory": "/opt/nifi/output"
        }
      }
    }
  }'
```

### 5. Create Connection Between Processors
```bash
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "source": {
        "id": "'$GETFILE_ID'",
        "groupId": "'$ROOT_ID'",
        "type": "PROCESSOR"
      },
      "destination": {
        "id": "'$PUTFILE_ID'",
        "groupId": "'$ROOT_ID'",
        "type": "PROCESSOR"
      },
      "selectedRelationships": ["success"]
    }
  }'
```

**Result**: Connection ID `b3349b59-0197-1000-6769-70e45de51c27`

### 6. Configure Auto-Terminating Relationships
```bash
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$PUTFILE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 2},
    "component": {
      "id": "'$PUTFILE_ID'",
      "config": {
        "autoTerminatedRelationships": ["success", "failure"]
      }
    }
  }'
```

### 7. Start Processors
```bash
# Start GetFile processor
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID/run-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 2},
    "state": "RUNNING"
  }'

# Start PutFile processor
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$PUTFILE_ID/run-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 3},
    "state": "RUNNING"
  }'
```

## Processor Configuration Details

### GetFile Processor Settings
- **Input Directory**: `/opt/nifi/input`
- **File Filter**: `[^\\.].*` (exclude hidden files)
- **Recurse Subdirectories**: `true`
- **Keep Source File**: `false` (move, don't copy)
- **Polling Interval**: `0 sec` (continuous monitoring)
- **Minimum File Age**: `0 sec` (process immediately)

### PutFile Processor Settings
- **Directory**: `/opt/nifi/output`
- **Conflict Resolution**: `fail` (error on duplicate names)
- **Create Missing Directories**: `true`
- **Auto-Terminated Relationships**: `["success", "failure"]`

### Connection Configuration
- **Source**: GetFile processor "success" relationship
- **Destination**: PutFile processor input
- **Queue Settings**: Default (10,000 objects, 1GB size limit)
- **Load Balancing**: Disabled (single node)

## Pipeline Flow Logic

1. **File Detection**: GetFile continuously monitors `/opt/nifi/input/`
2. **File Ingestion**: New files are read into NiFi FlowFiles
3. **Relationship Routing**: Success relationship sends to PutFile
4. **File Output**: PutFile writes to `/opt/nifi/output/`
5. **Cleanup**: Auto-termination completes the flow

## Error Handling

### Validation States
- **Invalid**: Missing required configurations
- **Valid**: All settings properly configured
- **Running**: Processors actively processing

### Common Issues Resolved
1. **Missing Input Directory**: Required property validation
2. **Unconnected Relationships**: Connection requirement enforcement
3. **Auto-Termination**: Success/failure relationship handling
4. **Revision Conflicts**: Version tracking for API updates

## Performance Metrics

### Processing Statistics
- **File Processing Time**: 9.6ms for 279-byte file
- **Throughput**: 1 file processed immediately
- **Memory Usage**: Minimal for simple file transfer
- **API Response Times**: Sub-second for all operations

### Monitoring Endpoints
```bash
# Check processor status
GET /nifi-api/processors/{id}

# View connection queue
GET /nifi-api/connections/{id}

# Monitor flow statistics
GET /nifi-api/flow/process-groups/{id}
```

## Automation Benefits

1. **Reproducible Deployments**: Exact pipeline recreation
2. **Version Control**: Pipeline-as-code capability
3. **CI/CD Integration**: Automated testing and deployment
4. **Rapid Prototyping**: Quick iteration and testing
5. **Documentation**: Self-documenting API calls

## Extension Possibilities

This foundation enables:
- **Complex Processors**: Data transformation, routing, validation
- **Multiple Connections**: Parallel processing paths
- **Controller Services**: Database connections, credential management
- **Parameter Contexts**: Environment-specific configurations
- **Process Groups**: Hierarchical workflow organization