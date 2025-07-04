[← Back to InfoMetis Home](../README.md)

# NiFi Pipeline Automation - Prototype Implementation

## Quick Start Example

### 1. Define Your Pipeline
```yaml
# customer-processor.yaml
pipeline:
  name: "Customer Data Processor"
  description: "Process customer CSV files and enrich with database lookups"
  
  input:
    type: "file"
    path: "/opt/nifi/input"
    format: "csv"
    
  processing:
    - validate_email:
        column: "email"
        pattern: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
    - lookup_customer:
        database: "customer_db"
        key: "customer_id"
        
  output:
    type: "file"
    path: "/opt/nifi/output"
    format: "json"
    
  error_handling:
    path: "/opt/nifi/errors"
```

### 2. Create the Pipeline
```bash
# Simple command-line interface
./create-pipeline.sh customer-processor.yaml

# Output:
✅ Pipeline created successfully!
📊 Dashboard: http://localhost:3000/pipeline/customer-processor
🔗 NiFi UI: http://nifi.local/nifi/?processGroupId=abc123
🔍 Logs: http://localhost:3000/logs/customer-processor
```

### 3. Monitor Operations
```bash
# Check status
./pipeline-status.sh customer-processor

# Output:
🟢 Customer Data Processor - RUNNING
├── Uptime: 2h 34m
├── Processed: 1,456 records
├── Throughput: 12.3 records/min
├── Errors: 0
└── Queue depth: 0

Direct links:
- View in NiFi: http://nifi.local/nifi/?processGroupId=abc123
- Performance metrics: http://dashboard.local/metrics/customer-processor
- Error logs: http://dashboard.local/errors/customer-processor
```

## Prototype Components

### Pipeline Templates
```bash
# Available templates
./list-templates.sh

📋 Available Pipeline Templates:
├── csv-processor      - CSV file processing with validation
├── api-integration    - REST API data integration  
├── database-sync      - Database-to-database synchronization
├── log-processor      - Log file analysis and routing
└── real-time-stream   - Real-time data streaming

# Create from template
./create-from-template.sh csv-processor --input="/data/sales" --output="/data/processed"
```

### Monitoring Dashboard (Simple HTML)
```html
<!DOCTYPE html>
<html>
<head>
    <title>NiFi Pipeline Dashboard</title>
    <meta http-equiv="refresh" content="30">
</head>
<body>
    <h1>📊 Pipeline Operations Dashboard</h1>
    
    <div class="overview">
        <h2>System Health</h2>
        <div class="status-grid">
            <div class="metric">
                <span class="value">5</span>
                <span class="label">Active Pipelines</span>
            </div>
            <div class="metric">
                <span class="value">1,234</span>
                <span class="label">Records/min</span>
            </div>
            <div class="metric">
                <span class="value">0</span>
                <span class="label">Critical Errors</span>
            </div>
        </div>
    </div>
    
    <div class="pipelines">
        <h2>Active Pipelines</h2>
        <!-- Generated from API -->
        <div class="pipeline-card">
            <h3>🔄 Customer Data Processor</h3>
            <p>Status: <span class="status running">RUNNING</span></p>
            <p>Throughput: 12.3 records/min</p>
            <p>Uptime: 2h 34m</p>
            <div class="actions">
                <a href="http://nifi.local/nifi/?processGroupId=abc123">View in NiFi</a>
                <a href="/api/pipelines/customer-processor/logs">View Logs</a>
                <a href="/api/pipelines/customer-processor/metrics">Metrics</a>
            </div>
        </div>
    </div>
</body>
</html>
```

## Implementation Scripts

### 1. Pipeline Creation Engine
```bash
#!/bin/bash
# create-pipeline.sh

PIPELINE_DEF=$1
NIFI_URL="http://nifi-service:8080"

echo "🚀 Creating pipeline from definition: $PIPELINE_DEF"

# Parse YAML definition
NAME=$(yq eval '.pipeline.name' $PIPELINE_DEF)
INPUT_PATH=$(yq eval '.pipeline.input.path' $PIPELINE_DEF)
OUTPUT_PATH=$(yq eval '.pipeline.output.path' $PIPELINE_DEF)

echo "📝 Pipeline: $NAME"
echo "📂 Input: $INPUT_PATH"
echo "📁 Output: $OUTPUT_PATH"

# Create processors via NiFi API
echo "🔧 Creating GetFile processor..."
GETFILE_ID=$(curl -s -X POST "$NIFI_URL/nifi-api/process-groups/root/processors" \
  -H "Content-Type: application/json" \
  -d "{
    \"revision\": {\"version\": 0},
    \"component\": {
      \"type\": \"org.apache.nifi.processors.standard.GetFile\",
      \"name\": \"$NAME - Input\",
      \"position\": {\"x\": 100, \"y\": 100},
      \"config\": {
        \"properties\": {
          \"Input Directory\": \"$INPUT_PATH\"
        }
      }
    }
  }" | jq -r '.id')

echo "🔧 Creating PutFile processor..."
PUTFILE_ID=$(curl -s -X POST "$NIFI_URL/nifi-api/process-groups/root/processors" \
  -H "Content-Type: application/json" \
  -d "{
    \"revision\": {\"version\": 0},
    \"component\": {
      \"type\": \"org.apache.nifi.processors.standard.PutFile\",
      \"name\": \"$NAME - Output\",
      \"position\": {\"x\": 400, \"y\": 100},
      \"config\": {
        \"properties\": {
          \"Directory\": \"$OUTPUT_PATH\"
        },
        \"autoTerminatedRelationships\": [\"success\", \"failure\"]
      }
    }
  }" | jq -r '.id')

echo "🔗 Creating connection..."
CONNECTION_ID=$(curl -s -X POST "$NIFI_URL/nifi-api/process-groups/root/connections" \
  -H "Content-Type: application/json" \
  -d "{
    \"revision\": {\"version\": 0},
    \"component\": {
      \"source\": {\"id\": \"$GETFILE_ID\", \"type\": \"PROCESSOR\"},
      \"destination\": {\"id\": \"$PUTFILE_ID\", \"type\": \"PROCESSOR\"},
      \"selectedRelationships\": [\"success\"]
    }
  }" | jq -r '.id')

echo "▶️ Starting processors..."
curl -s -X PUT "$NIFI_URL/nifi-api/processors/$GETFILE_ID/run-status" \
  -H "Content-Type: application/json" \
  -d '{"revision": {"version": 1}, "state": "RUNNING"}' > /dev/null

curl -s -X PUT "$NIFI_URL/nifi-api/processors/$PUTFILE_ID/run-status" \
  -H "Content-Type: application/json" \
  -d '{"revision": {"version": 1}, "state": "RUNNING"}' > /dev/null

# Save pipeline metadata
PIPELINE_ID=$(echo "$NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
cat > "pipelines/$PIPELINE_ID.json" << EOF
{
  "id": "$PIPELINE_ID",
  "name": "$NAME",
  "processors": {
    "getfile": "$GETFILE_ID",
    "putfile": "$PUTFILE_ID"
  },
  "connection": "$CONNECTION_ID",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "RUNNING"
}
EOF

echo ""
echo "✅ Pipeline created successfully!"
echo "📊 Dashboard: http://localhost:3000/pipeline/$PIPELINE_ID"
echo "🔗 NiFi UI: $NIFI_URL/nifi/"
echo "🔍 Config saved to: pipelines/$PIPELINE_ID.json"
```

### 2. Pipeline Status Monitor
```bash
#!/bin/bash
# pipeline-status.sh

PIPELINE_ID=$1
NIFI_URL="http://nifi-service:8080"

if [ ! -f "pipelines/$PIPELINE_ID.json" ]; then
  echo "❌ Pipeline not found: $PIPELINE_ID"
  exit 1
fi

# Load pipeline config
GETFILE_ID=$(jq -r '.processors.getfile' "pipelines/$PIPELINE_ID.json")
PUTFILE_ID=$(jq -r '.processors.putfile' "pipelines/$PIPELINE_ID.json")
NAME=$(jq -r '.name' "pipelines/$PIPELINE_ID.json")

# Get processor status
GETFILE_STATUS=$(curl -s "$NIFI_URL/nifi-api/processors/$GETFILE_ID" | jq -r '.status.aggregateSnapshot.runStatus')
PUTFILE_STATUS=$(curl -s "$NIFI_URL/nifi-api/processors/$PUTFILE_ID" | jq -r '.status.aggregateSnapshot.runStatus')

# Get metrics
FILES_IN=$(curl -s "$NIFI_URL/nifi-api/processors/$GETFILE_ID" | jq -r '.status.aggregateSnapshot.flowFilesOut')
FILES_OUT=$(curl -s "$NIFI_URL/nifi-api/processors/$PUTFILE_ID" | jq -r '.status.aggregateSnapshot.flowFilesIn')

# Display status
if [ "$GETFILE_STATUS" = "Running" ] && [ "$PUTFILE_STATUS" = "Running" ]; then
  echo "🟢 $NAME - RUNNING"
else
  echo "🔴 $NAME - STOPPED"
fi

echo "├── Input processor: $GETFILE_STATUS"
echo "├── Output processor: $PUTFILE_STATUS"
echo "├── Files processed: $FILES_IN → $FILES_OUT"
echo "└── Created: $(jq -r '.created' "pipelines/$PIPELINE_ID.json")"

echo ""
echo "Direct links:"
echo "- View in NiFi: $NIFI_URL/nifi/"
echo "- Pipeline config: pipelines/$PIPELINE_ID.json"
```

### 3. Simple Dashboard API
```javascript
// dashboard-api.js - Simple Express.js API
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PIPELINES_DIR = './pipelines';

// List all pipelines
app.get('/api/pipelines', (req, res) => {
  const pipelines = fs.readdirSync(PIPELINES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const config = JSON.parse(fs.readFileSync(path.join(PIPELINES_DIR, file)));
      return {
        id: config.id,
        name: config.name,
        status: config.status,
        created: config.created,
        links: {
          nifi: `http://nifi-service:8080/nifi/`,
          dashboard: `/pipeline/${config.id}`,
          logs: `/logs/${config.id}`
        }
      };
    });
  
  res.json({ pipelines });
});

// Get specific pipeline
app.get('/api/pipelines/:id', (req, res) => {
  const configPath = path.join(PIPELINES_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(configPath)) {
    return res.status(404).json({ error: 'Pipeline not found' });
  }
  
  const config = JSON.parse(fs.readFileSync(configPath));
  res.json(config);
});

// Serve static dashboard
app.use(express.static('public'));

app.listen(3000, () => {
  console.log('📊 Dashboard running on http://localhost:3000');
});
```

## Usage Examples

### Create a Customer Processing Pipeline
```bash
# 1. Define the pipeline
cat > customer-pipeline.yaml << EOF
pipeline:
  name: "Customer CSV Processor"
  input:
    type: "file"
    path: "/opt/nifi/input"
  output:
    type: "file"
    path: "/opt/nifi/output"
EOF

# 2. Create it
./create-pipeline.sh customer-pipeline.yaml

# 3. Add test data
echo "id,name,email" > /opt/nifi/input/customers.csv
echo "1,John,john@example.com" >> /opt/nifi/input/customers.csv

# 4. Check status
./pipeline-status.sh customer-csv-processor

# 5. View results
ls -la /opt/nifi/output/
```

### Monitor All Pipelines
```bash
# List all active pipelines
curl http://localhost:3000/api/pipelines | jq '.pipelines[] | {name, status}'

# Output:
{
  "name": "Customer CSV Processor",
  "status": "RUNNING"
}
```

This prototype demonstrates the core concept: **simple definitions → automated creation → operational visibility**. From here we can iterate and add more sophisticated features!