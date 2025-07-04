# NiFi REST API Examples

## Overview

This document provides comprehensive examples of using the NiFi REST API for programmatic pipeline creation, management, and monitoring.

## Authentication

### Obtain Access Token
```bash
# Get JWT token for API access
TOKEN=$(curl -k -X POST \
  'https://localhost:8443/nifi-api/access/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=adminpassword')

echo "Token: $TOKEN"
```

### Use Token in Subsequent Requests
```bash
# All API calls require the Bearer token
curl -k -H "Authorization: Bearer $TOKEN" \
  https://localhost:8443/nifi-api/system-diagnostics
```

## Process Group Operations

### Get Root Process Group
```bash
# Retrieve root process group information
curl -k -H "Authorization: Bearer $TOKEN" \
  https://localhost:8443/nifi-api/flow/process-groups/root | jq .

# Extract root process group ID
ROOT_ID=$(curl -k -s -H "Authorization: Bearer $TOKEN" \
  https://localhost:8443/nifi-api/flow/process-groups/root | \
  jq -r '.processGroupFlow.id')

echo "Root Process Group ID: $ROOT_ID"
```

### Create Child Process Group
```bash
# Create a new process group for organizing workflows
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/process-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "name": "File Processing Workflows",
      "position": {"x": 200, "y": 200}
    }
  }'
```

## Processor Management

### List Available Processor Types
```bash
# Get all available processor types
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/flow/processor-types" | \
  jq '.processorTypes[] | select(.type | contains("File")) | .type'
```

### Create GetFile Processor
```bash
# Create and configure a GetFile processor
GETFILE_RESPONSE=$(curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.GetFile",
      "position": {"x": 100, "y": 100},
      "config": {
        "properties": {
          "Input Directory": "/opt/nifi/input",
          "Keep Source File": "false",
          "File Filter": ".*\\.csv$"
        },
        "schedulingPeriod": "10 sec"
      }
    }
  }')

GETFILE_ID=$(echo $GETFILE_RESPONSE | jq -r '.id')
echo "GetFile Processor ID: $GETFILE_ID"
```

### Create PutFile Processor
```bash
# Create and configure a PutFile processor
PUTFILE_RESPONSE=$(curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.PutFile",
      "position": {"x": 400, "y": 100},
      "config": {
        "properties": {
          "Directory": "/opt/nifi/output",
          "Conflict Resolution Strategy": "replace",
          "Create Missing Directories": "true"
        },
        "autoTerminatedRelationships": ["success", "failure"]
      }
    }
  }')

PUTFILE_ID=$(echo $PUTFILE_RESPONSE | jq -r '.id')
echo "PutFile Processor ID: $PUTFILE_ID"
```

### Create Data Transformation Processor
```bash
# Create a ReplaceText processor for data transformation
TRANSFORM_RESPONSE=$(curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.ReplaceText",
      "position": {"x": 250, "y": 100},
      "config": {
        "properties": {
          "Search Value": "Widget",
          "Replacement Value": "Product",
          "Replacement Strategy": "Regex Replace"
        }
      }
    }
  }')

TRANSFORM_ID=$(echo $TRANSFORM_RESPONSE | jq -r '.id')
echo "Transform Processor ID: $TRANSFORM_ID"
```

## Connection Management

### Create Simple Connection (GetFile → PutFile)
```bash
# Create connection between GetFile and PutFile
CONNECTION_RESPONSE=$(curl -k -X POST \
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
      "selectedRelationships": ["success"],
      "backPressureObjectThreshold": 1000,
      "backPressureDataSizeThreshold": "100 MB"
    }
  }')

CONNECTION_ID=$(echo $CONNECTION_RESPONSE | jq -r '.id')
echo "Connection ID: $CONNECTION_ID"
```

### Create Multi-Step Pipeline Connection
```bash
# Create GetFile → Transform → PutFile pipeline
# Connection 1: GetFile → Transform
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "source": {"id": "'$GETFILE_ID'", "groupId": "'$ROOT_ID'", "type": "PROCESSOR"},
      "destination": {"id": "'$TRANSFORM_ID'", "groupId": "'$ROOT_ID'", "type": "PROCESSOR"},
      "selectedRelationships": ["success"]
    }
  }'

# Connection 2: Transform → PutFile
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "source": {"id": "'$TRANSFORM_ID'", "groupId": "'$ROOT_ID'", "type": "PROCESSOR"},
      "destination": {"id": "'$PUTFILE_ID'", "groupId": "'$ROOT_ID'", "type": "PROCESSOR"},
      "selectedRelationships": ["success"]
    }
  }'
```

## Processor Control

### Start Processors
```bash
# Get current processor revision
GETFILE_REVISION=$(curl -k -s -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" | \
  jq -r '.revision.version')

# Start GetFile processor
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID/run-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": '$GETFILE_REVISION'},
    "state": "RUNNING"
  }'

# Start all processors in process group
curl -k -X PUT \
  "https://localhost:8443/nifi-api/flow/process-groups/$ROOT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'$ROOT_ID'",
    "state": "RUNNING"
  }'
```

### Stop Processors
```bash
# Stop individual processor
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID/run-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": '$GETFILE_REVISION'},
    "state": "STOPPED"
  }'

# Stop all processors in process group
curl -k -X PUT \
  "https://localhost:8443/nifi-api/flow/process-groups/$ROOT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'$ROOT_ID'",
    "state": "STOPPED"
  }'
```

## Monitoring and Status

### Get Processor Status
```bash
# Get detailed processor status
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" | \
  jq '.status.aggregateSnapshot'

# Monitor processing statistics
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" | \
  jq '{
    name: .component.name,
    state: .status.aggregateSnapshot.runStatus,
    input: .status.aggregateSnapshot.input,
    output: .status.aggregateSnapshot.output,
    tasks: .status.aggregateSnapshot.tasks
  }'
```

### Get Connection Queue Status
```bash
# Check connection queue depth
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/connections/$CONNECTION_ID" | \
  jq '.status.aggregateSnapshot | {
    queued: .queued,
    queuedCount: .queuedCount,
    queuedSize: .queuedSize
  }'
```

### System-Wide Status
```bash
# Get overall cluster status
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/flow/cluster/summary"

# Get system diagnostics
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/system-diagnostics" | \
  jq '.systemDiagnostics.aggregateSnapshot'
```

## Configuration Management

### Update Processor Configuration
```bash
# Get current processor configuration
CURRENT_CONFIG=$(curl -k -s -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID")

CURRENT_REVISION=$(echo $CURRENT_CONFIG | jq -r '.revision.version')

# Update processor properties
curl -k -X PUT \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": '$CURRENT_REVISION'},
    "component": {
      "id": "'$GETFILE_ID'",
      "config": {
        "properties": {
          "Input Directory": "/opt/nifi/input",
          "File Filter": ".*\\.csv$",
          "Polling Interval": "5 sec",
          "Batch Size": "20"
        }
      }
    }
  }'
```

### Processor Template Operations
```bash
# Create template from existing processors
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CSV File Processing Template",
    "description": "Template for processing CSV files",
    "snippetId": "'$SNIPPET_ID'"
  }'

# List available templates
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/flow/templates" | \
  jq '.templates[] | {id: .id, name: .template.name}'
```

## Advanced Operations

### Parameter Context Management
```bash
# Create parameter context for environment-specific configuration
curl -k -X POST \
  "https://localhost:8443/nifi-api/parameter-contexts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "name": "File Processing Parameters",
      "description": "Parameters for file processing workflows",
      "parameters": [
        {
          "parameter": {
            "name": "input.directory",
            "value": "/opt/nifi/input",
            "sensitive": false,
            "description": "Input directory for file processing"
          }
        },
        {
          "parameter": {
            "name": "output.directory", 
            "value": "/opt/nifi/output",
            "sensitive": false,
            "description": "Output directory for processed files"
          }
        }
      ]
    }
  }'
```

### Controller Services
```bash
# Create a controller service (e.g., CSV Reader)
curl -k -X POST \
  "https://localhost:8443/nifi-api/process-groups/$ROOT_ID/controller-services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.csv.CSVReader",
      "name": "CSV Reader Service",
      "properties": {
        "CSV Format": "RFC4180",
        "Value Separator": ",",
        "Skip Header Line": "true"
      }
    }
  }'
```

### Reporting Tasks
```bash
# Create reporting task for monitoring
curl -k -X POST \
  "https://localhost:8443/nifi-api/reporting-tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.reporting.StandardProcessorMetricsReportingTask",
      "name": "Processor Metrics Reporter",
      "properties": {
        "Metrics Endpoint": "http://localhost:9090/metrics",
        "Send JVM Metrics": "true"
      },
      "schedulingPeriod": "30 sec"
    }
  }'
```

## Error Handling

### Check for Validation Errors
```bash
# Get processor validation status
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" | \
  jq '{
    validationStatus: .component.validationStatus,
    validationErrors: .component.validationErrors
  }'
```

### Handle API Errors
```bash
# Example error handling in scripts
response=$(curl -k -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -ne 200 ]; then
    echo "API Error: HTTP $http_code"
    echo "Response: $body"
    exit 1
fi
```

## Utility Scripts

### Complete Pipeline Creation Script
```bash
#!/bin/bash
# create-pipeline.sh - Complete pipeline creation automation

set -e

# Configuration
NIFI_URL="https://localhost:8443"
USERNAME="admin"
PASSWORD="adminpassword"

# Get authentication token
echo "Authenticating with NiFi..."
TOKEN=$(curl -k -s -X POST \
  "$NIFI_URL/nifi-api/access/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "username=$USERNAME&password=$PASSWORD")

# Get root process group
echo "Getting root process group..."
ROOT_ID=$(curl -k -s -H "Authorization: Bearer $TOKEN" \
  "$NIFI_URL/nifi-api/flow/process-groups/root" | \
  jq -r '.processGroupFlow.id')

echo "Root Process Group ID: $ROOT_ID"

# Create processors and connections
echo "Creating GetFile processor..."
# ... (processor creation code)

echo "Pipeline created successfully!"
```

### Monitoring Script
```bash
#!/bin/bash
# monitor-pipeline.sh - Pipeline monitoring automation

while true; do
    # Get processor statistics
    stats=$(curl -k -s -H "Authorization: Bearer $TOKEN" \
      "$NIFI_URL/nifi-api/processors/$GETFILE_ID" | \
      jq -r '.status.aggregateSnapshot | "\(.input) in, \(.output) out, \(.tasks) tasks"')
    
    echo "$(date): $stats"
    sleep 10
done
```

This comprehensive API documentation enables full programmatic control of NiFi workflows, supporting automation, monitoring, and integration with external systems.