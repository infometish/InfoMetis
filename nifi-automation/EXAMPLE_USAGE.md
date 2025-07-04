[← Back to Automation Home](README.md)

# Example Usage: From Conversation to Running Pipeline

## 🗣️ Conversational Workflow

### Step 1: Natural Language Request
```
User: "I need a pipeline that processes customer orders from CSV files, 
validates the email addresses, and outputs valid records as JSON while 
sending invalid ones to an error directory."
```

### Step 2: Pipeline Definition Creation
Based on the conversation, create a YAML definition:

```yaml
# customer-order-processor.yaml
pipeline:
  name: "Customer Order Processor"
  description: "Validates customer orders and routes valid/invalid records"
  
  input:
    type: "file"
    path: "/opt/nifi/input/orders"
    format: "csv"
    
  processing:
    - validate_email:
        column: "customer_email"
        pattern: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
        
  output:
    type: "file"
    path: "/opt/nifi/output/valid"
    format: "json"
    
  error_handling:
    path: "/opt/nifi/output/errors"
    format: "csv"
```

### Step 3: Automated Pipeline Creation
```bash
cd nifi-automation/scripts
./create-pipeline.sh ../customer-order-processor.yaml

# Output:
🚀 Creating pipeline from definition: ../customer-order-processor.yaml
📝 Pipeline: Customer Order Processor
📂 Input: /opt/nifi/input/orders
📁 Output: /opt/nifi/output/valid
✅ Pipeline 'Customer Order Processor' created successfully!

📊 Management Links:
   Dashboard: http://localhost:3000/pipeline/customer-order-processor
   NiFi UI: http://nifi-service:8080/nifi/?processGroupId=abc123
   Config: ../pipelines/customer-order-processor.json
```

### Step 4: Operational Monitoring
```bash
# Check pipeline status
./pipeline-status.sh customer-order-processor

# Output:
🟢 Customer Order Processor - RUNNING
Validates customer orders and routes valid/invalid records

📊 Pipeline Overview:
   ├── Status: RUNNING
   ├── Uptime: 15m
   ├── Input Path: /opt/nifi/input/orders
   └── Output Path: /opt/nifi/output/valid

🔧 Processor Status:
   ├── GetFile: 🟢 Running
   └── PutFile: 🟢 Running

📈 Processing Metrics:
   ├── Files Read: 23
   ├── Files Written: 23
   ├── Bytes Processed: 15,678
   └── Success Rate: 100%

🔗 Management Links:
   ├── NiFi UI: http://nifi-service:8080/nifi/?processGroupId=abc123
   ├── Dashboard: http://localhost:3000/pipeline/customer-order-processor
   └── Config: ../pipelines/customer-order-processor.json
```

### Step 5: Data Testing
```bash
# Create test data
cat > /opt/nifi/input/orders/sample_orders.csv << EOF
order_id,customer_name,customer_email,amount
1001,John Smith,john@example.com,99.99
1002,Jane Doe,invalid-email,149.50
1003,Bob Johnson,bob@company.org,75.00
EOF

# Check processing results
ls -la /opt/nifi/output/valid/
ls -la /opt/nifi/output/errors/

# View processed data
cat /opt/nifi/output/valid/sample_orders.json
cat /opt/nifi/output/errors/sample_orders_errors.csv
```

## 🔄 Real-World Scenarios

### Scenario 1: Log Processing Pipeline
```
Conversation: "I need to process application logs, extract error messages, 
and send critical errors to our alerting system."

Pipeline Definition:
```yaml
pipeline:
  name: "Application Log Processor"
  description: "Processes app logs and extracts critical errors"
  
  input:
    type: "file"
    path: "/opt/nifi/logs/app"
    format: "text"
    
  processing:
    - extract_errors:
        pattern: "ERROR|CRITICAL|FATAL"
    - parse_json:
        enabled: true
        
  output:
    type: "http"
    endpoint: "http://alerting-service/webhook"
    format: "json"
```

### Scenario 2: Database Sync Pipeline
```
Conversation: "I need to sync customer data from our CRM database 
to our analytics warehouse every hour."

Pipeline Definition:
```yaml
pipeline:
  name: "CRM Data Sync"
  description: "Hourly sync from CRM to analytics warehouse"
  
  input:
    type: "database"
    connection: "crm_db"
    query: "SELECT * FROM customers WHERE updated_at > ?"
    schedule: "0 */1 * * *"  # Every hour
    
  processing:
    - transform:
        mapping:
          customer_id: "id"
          full_name: "name"
          email_address: "email"
          
  output:
    type: "database"
    connection: "analytics_warehouse"
    table: "dim_customers"
    mode: "upsert"
```

### Scenario 3: API Integration Pipeline
```
Conversation: "I need to fetch data from our partner's API every 5 minutes 
and store it in our database for analysis."

Pipeline Definition:
```yaml
pipeline:
  name: "Partner API Integration"
  description: "Fetches partner data via API and stores locally"
  
  input:
    type: "http"
    url: "https://partner-api.com/data"
    method: "GET"
    headers:
      Authorization: "Bearer ${api_token}"
    schedule: "*/5 * * * *"  # Every 5 minutes
    
  processing:
    - validate_json:
        schema: "partner_data_schema.json"
    - enrich:
        add_timestamp: true
        add_source: "partner_api"
        
  output:
    type: "database"
    connection: "local_analytics"
    table: "partner_data"
    mode: "append"
```

## 📊 Operations Dashboard View

### System Health Overview
```
📊 NiFi Pipeline Operations Dashboard
Thu Jul  4 10:30:00 UTC 2025

🏠 System Overview
   ├── Total Pipelines: 3
   ├── Running: 🟢 3
   ├── Stopped: 🔴 0
   └── NiFi URL: http://nifi-service:8080

🔄 Active Pipelines

📄 Customer Order Processor
   ├── ID: customer-order-processor
   ├── Status: 🟢 RUNNING
   ├── Input: /opt/nifi/input/orders
   ├── Output: /opt/nifi/output/valid
   ├── Created: 2025-07-04T10:15:00Z
   └── Links:
      ├── Status: ./pipeline-status.sh customer-order-processor
      ├── NiFi UI: http://nifi-service:8080/nifi/?processGroupId=abc123
      └── Config: ../pipelines/customer-order-processor.json

📄 Application Log Processor
   ├── ID: application-log-processor
   ├── Status: 🟢 RUNNING
   ├── Input: /opt/nifi/logs/app
   ├── Output: http://alerting-service/webhook
   ├── Created: 2025-07-04T09:45:00Z
   └── Links: [...]

📄 CRM Data Sync
   ├── ID: crm-data-sync
   ├── Status: 🟢 RUNNING
   ├── Input: crm_db (hourly query)
   ├── Output: analytics_warehouse.dim_customers
   ├── Created: 2025-07-04T08:30:00Z
   └── Links: [...]
```

## 🎯 User Experience Flow

### For Business Users
1. **Request**: "I need X pipeline that does Y"
2. **Creation**: Developer creates YAML definition
3. **Deployment**: Automated pipeline creation
4. **Monitoring**: Real-time dashboard access
5. **Iteration**: Modify and redeploy as needed

### For Developers
1. **Define**: Write simple YAML configuration
2. **Deploy**: One command pipeline creation
3. **Monitor**: Built-in status and metrics
4. **Debug**: Direct links to NiFi UI and logs
5. **Scale**: Template-based rapid deployment

### For Operations
1. **Overview**: System-wide dashboard
2. **Drill-down**: Per-pipeline detailed status
3. **Troubleshoot**: Direct access to logs and metrics
4. **Maintain**: Clear status indicators and alerts

## 🚀 Future Enhancements

### Natural Language Processing
```
User: "Create a real-time pipeline for fraud detection"

AI Assistant: "I'll create a fraud detection pipeline with:
- Real-time transaction stream input
- ML model scoring
- Risk threshold routing
- Alert generation for high-risk transactions

Creating pipeline... ✅ Done!"
```

### Template Generation
```bash
# Generate template from existing NiFi flow
./extract-template.sh --nifi-group-id abc123 --output fraud-detection.yaml

# Create variations
./create-variation.sh fraud-detection.yaml --env staging
./create-variation.sh fraud-detection.yaml --throughput high
```

### Multi-Environment Management
```bash
# Deploy to multiple environments
./deploy-pipeline.sh customer-orders --env dev,staging,prod

# Environment-specific configurations
./pipeline-status.sh customer-orders --env prod
```

This automation system makes data pipeline development **accessible, visible, and manageable** for teams of all technical levels!