[← Back to InfoMetis Home](../README.md)

# NiFi Development Prototype Design

## Overview

This document defines a complete NiFi development prototype with a practical file processing pipeline that demonstrates core data flow capabilities for InfoMetis development.

## Example Pipeline: CSV Customer Data Enrichment

### **Use Case**
Process customer order files by enriching them with customer metadata and generating summary reports.

### **Data Flow Architecture**
```
Input CSV → Data Validation → Customer Enrichment → Summary Generation → Output Files
```

## Example Data Structure

### **Input File: `customer_orders.csv`**
```csv
order_id,customer_id,product_name,quantity,price,order_date
ORD001,CUST123,Widget A,2,29.99,2025-01-15
ORD002,CUST456,Widget B,1,45.50,2025-01-15
ORD003,CUST123,Widget C,3,15.25,2025-01-15
```

### **Customer Lookup File: `customer_lookup.csv`**
```csv
customer_id,customer_name,customer_tier,region
CUST123,Acme Corp,Gold,North America
CUST456,Beta Solutions,Silver,Europe
CUST789,Gamma Industries,Bronze,Asia Pacific
```

### **Expected Output Files:**
1. **`enriched_orders.csv`** - Orders with customer details
2. **`daily_summary.json`** - Aggregated metrics
3. **`error_records.csv`** - Invalid/unmatched records

## Complete Pipeline Design

### **Pipeline Flow:**
```
GetFile → ValidateRecord → LookupRecord → RouteOnAttribute → [3 Output Processors]
```

### **Processor Configuration:**

#### 1. **GetFile Processor**
- **Purpose**: Monitor input directory for CSV files
- **Configuration**:
  - Input Directory: `/opt/nifi/input`
  - File Filter: `.*\.csv`
  - Keep Source File: `false`
  - Minimum File Age: `1 sec`

#### 2. **ValidateRecord Processor**  
- **Purpose**: Validate CSV structure and required fields
- **Configuration**:
  - Record Reader: `CSVReader`
  - Record Writer: `CSVRecordSetWriter`
  - Validation Rules: Check required fields (order_id, customer_id, etc.)

#### 3. **LookupRecord Processor**
- **Purpose**: Enrich orders with customer data
- **Configuration**:
  - Record Reader: `CSVReader`
  - Record Writer: `CSVRecordSetWriter`
  - Lookup Service: `CSVRecordLookupService` (customer_lookup.csv)
  - Lookup Key: `customer_id`

#### 4. **RouteOnAttribute Processor**
- **Purpose**: Route records based on processing status
- **Routes**:
  - `enriched`: Successfully enriched records
  - `error`: Records with missing customer data
  - `summary`: Trigger for summary generation

#### 5. **Output Processors:**

**5a. PutFile (Enriched Data)**
- Directory: `/opt/nifi/output/enriched`
- Filename: `enriched_orders_${now():format('yyyyMMdd_HHmmss')}.csv`

**5b. PutFile (Error Records)**
- Directory: `/opt/nifi/output/errors`
- Filename: `error_records_${now():format('yyyyMMdd_HHmmss')}.csv`

**5c. ExecuteScript (Summary Generation)**
- Script Language: `python`
- Generate JSON summary with daily metrics
- Output to: `/opt/nifi/output/summary/daily_summary_${now():format('yyyyMMdd')}.json`

## InfoMetis Architecture Alignment

### **Technology Integration**
This prototype aligns with InfoMetis core technologies from `docs/preliminary/selected-technologies.md`:

✅ **NiFi**: Listed as confirmed service example for "Data flow processing"
✅ **Docker**: Containerized deployment supporting k0s orchestration path
✅ **GitOps Ready**: Kustomize-compatible configuration for FluxCD deployment
✅ **Self-Contained Core**: Follows internal communication principles

### **Architectural Principles Compliance**
Per `docs/preliminary/core-architectural-principles.md`:

✅ **Internal Communication**: NiFi processes data within InfoMetis boundary
✅ **Environment Agnostic**: Core NiFi service independent of deployment environment  
✅ **Adaptation Layer Ready**: File volumes can be replaced with Traefik-managed external connections
✅ **Border Complexity**: External data sources handled through adaptation layer (future)

### **Phase 1 Alignment**
Matches `docs/preliminary/project-scope-and-priorities.md` Phase 1 priorities:

✅ **NiFi-Centric Prototyping**: Primary focus on NiFi for pipeline development
✅ **UI Access**: Direct access to NiFi UI for development and monitoring
✅ **TDD Infrastructure**: Foundation for test framework development
✅ **Basic Monitoring**: Essential observability for development

## Docker Setup for Prototype

### **InfoMetis-Compatible Directory Structure**
```
infometis-nifi-prototype/
├── docker-compose.yml           # Development deployment
├── kustomize/                   # Future GitOps integration
│   ├── base/
│   └── overlays/
│       ├── development/
│       └── production/
├── data/
│   ├── input/                   # Simulates external data sources
│   │   ├── customer_orders.csv
│   │   └── customer_lookup.csv
│   └── output/                  # Simulates external data sinks
│       ├── enriched/
│       ├── errors/
│       └── summary/
├── nifi/                        # NiFi persistence (development)
│   ├── conf/
│   ├── database_repository/
│   ├── flowfile_repository/
│   ├── content_repository/
│   └── provenance_repository/
└── sample-data/
    ├── customer_orders.csv
    └── customer_lookup.csv
```

### **Container Deployment Options**

#### **Option A: Docker Compose (Traditional)**
```yaml
version: '3.8'
services:
  nifi:
    image: apache/nifi:latest
    container_name: infometis-nifi-prototype
    ports:
      - "8080:8080"
    volumes:
      # Data directories (simulating external adaptation layer)
      - ./data/input:/opt/nifi/input
      - ./data/output:/opt/nifi/output
      # NiFi persistence (development environment)
      - ./nifi/database_repository:/opt/nifi/nifi-current/database_repository
      - ./nifi/flowfile_repository:/opt/nifi/nifi-current/flowfile_repository
      - ./nifi/content_repository:/opt/nifi/nifi-current/content_repository
      - ./nifi/provenance_repository:/opt/nifi/nifi-current/provenance_repository
    environment:
      - NIFI_WEB_HTTP_PORT=8080
      - SINGLE_USER_CREDENTIALS_USERNAME=admin
      - SINGLE_USER_CREDENTIALS_PASSWORD=adminpassword
      # InfoMetis environment markers
      - INFOMETIS_COMPONENT=nifi-core
      - INFOMETIS_PROCESSING_UNIT=data-processing
    restart: unless-stopped
    labels:
      # Future Traefik integration labels
      - "traefik.enable=true"
      - "traefik.http.routers.nifi.rule=Host(`nifi.infometis.local`)"
      - "traefik.http.services.nifi.loadbalancer.server.port=8080"
```

#### **Option B: Podman Compose (Rootless & Secure)**
```yaml
version: '3.8'
services:
  nifi:
    image: apache/nifi:latest
    container_name: infometis-nifi-prototype
    ports:
      - "8080:8080"
    volumes:
      # Data directories (simulating external adaptation layer)
      - ./data/input:/opt/nifi/input:Z
      - ./data/output:/opt/nifi/output:Z
      # NiFi persistence (development environment)
      - ./nifi/database_repository:/opt/nifi/nifi-current/database_repository:Z
      - ./nifi/flowfile_repository:/opt/nifi/nifi-current/flowfile_repository:Z
      - ./nifi/content_repository:/opt/nifi/nifi-current/content_repository:Z
      - ./nifi/provenance_repository:/opt/nifi/nifi-current/provenance_repository:Z
    environment:
      - NIFI_WEB_HTTP_PORT=8080
      - SINGLE_USER_CREDENTIALS_USERNAME=admin
      - SINGLE_USER_CREDENTIALS_PASSWORD=adminpassword
      # InfoMetis environment markers
      - INFOMETIS_COMPONENT=nifi-core
      - INFOMETIS_PROCESSING_UNIT=data-processing
    restart: unless-stopped
    labels:
      # Future Traefik integration labels
      - "traefik.enable=true"
      - "traefik.http.routers.nifi.rule=Host(`nifi.infometis.local`)"
      - "traefik.http.services.nifi.loadbalancer.server.port=8080"
```

#### **Option C: Podman without Compose (Pure Podman)**
```bash
# Create pod for NiFi (similar to k8s pod)
podman pod create --name infometis-nifi-pod --publish 8080:8080

# Run NiFi container in pod
podman run -d \
  --name infometis-nifi-prototype \
  --pod infometis-nifi-pod \
  --volume ./data/input:/opt/nifi/input:Z \
  --volume ./data/output:/opt/nifi/output:Z \
  --volume ./nifi/database_repository:/opt/nifi/nifi-current/database_repository:Z \
  --volume ./nifi/flowfile_repository:/opt/nifi/nifi-current/flowfile_repository:Z \
  --volume ./nifi/content_repository:/opt/nifi/nifi-current/content_repository:Z \
  --volume ./nifi/provenance_repository:/opt/nifi/nifi-current/provenance_repository:Z \
  --env NIFI_WEB_HTTP_PORT=8080 \
  --env SINGLE_USER_CREDENTIALS_USERNAME=admin \
  --env SINGLE_USER_CREDENTIALS_PASSWORD=adminpassword \
  --env INFOMETIS_COMPONENT=nifi-core \
  --env INFOMETIS_PROCESSING_UNIT=data-processing \
  --restart unless-stopped \
  apache/nifi:latest
```

## Sample Data Files

### **Sample customer_orders.csv**
```csv
order_id,customer_id,product_name,quantity,price,order_date
ORD001,CUST123,Widget A,2,29.99,2025-01-15
ORD002,CUST456,Widget B,1,45.50,2025-01-15
ORD003,CUST123,Widget C,3,15.25,2025-01-15
ORD004,CUST789,Widget A,1,29.99,2025-01-15
ORD005,CUST999,Widget D,2,35.00,2025-01-15
```

### **Sample customer_lookup.csv**
```csv
customer_id,customer_name,customer_tier,region
CUST123,Acme Corporation,Gold,North America
CUST456,Beta Solutions Ltd,Silver,Europe
CUST789,Gamma Industries,Bronze,Asia Pacific
```

## Expected Processing Results

### **enriched_orders.csv**
```csv
order_id,customer_id,product_name,quantity,price,order_date,customer_name,customer_tier,region
ORD001,CUST123,Widget A,2,29.99,2025-01-15,Acme Corporation,Gold,North America
ORD002,CUST456,Widget B,1,45.50,2025-01-15,Beta Solutions Ltd,Silver,Europe
ORD003,CUST123,Widget C,3,15.25,2025-01-15,Acme Corporation,Gold,North America
ORD004,CUST789,Widget A,1,29.99,2025-01-15,Gamma Industries,Bronze,Asia Pacific
```

### **error_records.csv**
```csv
order_id,customer_id,product_name,quantity,price,order_date,error_reason
ORD005,CUST999,Widget D,2,35.00,2025-01-15,Customer not found in lookup
```

### **daily_summary.json**
```json
{
  "processing_date": "2025-01-15",
  "total_orders": 5,
  "successful_enrichments": 4,
  "failed_enrichments": 1,
  "total_revenue": 150.73,
  "customer_tiers": {
    "Gold": 2,
    "Silver": 1,
    "Bronze": 1
  },
  "regional_distribution": {
    "North America": 2,
    "Europe": 1,
    "Asia Pacific": 1
  }
}
```

## Quick Start Commands

### **1. Setup Environment**
```bash
# Create directory structure
mkdir -p nifi-prototype/{data/{input,output/{enriched,errors,summary}},nifi,sample-data}

# Set permissions
sudo chown -R 1000:1000 nifi-prototype/nifi

# Create sample data files
# (Copy sample CSV content above into respective files)
```

### **2. Launch NiFi**

#### **Docker Approach:**
```bash
cd infometis-nifi-prototype
docker-compose up -d

# Wait for startup (30-60 seconds)
docker logs infometis-nifi-prototype -f
```

#### **Podman Compose Approach:**
```bash
cd infometis-nifi-prototype
podman-compose up -d

# Wait for startup (30-60 seconds)
podman logs infometis-nifi-prototype -f
```

#### **Pure Podman Approach:**
```bash
cd infometis-nifi-prototype

# Create directories and set permissions
mkdir -p nifi/{database_repository,flowfile_repository,content_repository,provenance_repository}
mkdir -p data/{input,output/{enriched,errors,summary}}

# Create pod and run container
podman pod create --name infometis-nifi-pod --publish 8080:8080
podman run -d \
  --name infometis-nifi-prototype \
  --pod infometis-nifi-pod \
  --volume ./data/input:/opt/nifi/input:Z \
  --volume ./data/output:/opt/nifi/output:Z \
  --volume ./nifi/database_repository:/opt/nifi/nifi-current/database_repository:Z \
  --volume ./nifi/flowfile_repository:/opt/nifi/nifi-current/flowfile_repository:Z \
  --volume ./nifi/content_repository:/opt/nifi/nifi-current/content_repository:Z \
  --volume ./nifi/provenance_repository:/opt/nifi/nifi-current/provenance_repository:Z \
  --env NIFI_WEB_HTTP_PORT=8080 \
  --env SINGLE_USER_CREDENTIALS_USERNAME=admin \
  --env SINGLE_USER_CREDENTIALS_PASSWORD=adminpassword \
  --env INFOMETIS_COMPONENT=nifi-core \
  --env INFOMETIS_PROCESSING_UNIT=data-processing \
  --restart unless-stopped \
  apache/nifi:latest

# Monitor startup
podman logs -f infometis-nifi-prototype
```

### **3. Access NiFi**
- URL: http://localhost:8080/nifi
- Username: `admin`
- Password: `adminpassword`

### **4. Test Pipeline**

#### **All Container Approaches:**
```bash
# Copy sample data to input directory
cp sample-data/* data/input/

# Monitor output directories
watch -n 2 "ls -la data/output/*/"
```

#### **Podman-Specific Container Management:**
```bash
# List running containers/pods
podman ps
podman pod ps

# Stop and restart
podman stop infometis-nifi-prototype
podman start infometis-nifi-prototype

# Or manage the entire pod
podman pod stop infometis-nifi-pod
podman pod start infometis-nifi-pod

# Remove everything for fresh start
podman pod rm -f infometis-nifi-pod
```

## Container Technology Benefits

### **Podman Advantages for InfoMetis**
✅ **Rootless Operation**: Enhanced security without root privileges
✅ **Pod Support**: Native k8s-style pod concepts for multi-container units  
✅ **OCI Compliance**: Seamless compatibility with k0s/Kubernetes
✅ **No Daemon**: Simplified security model and resource usage
✅ **SELinux Integration**: Better integration with enterprise security (`:Z` volume flags)

### **Docker vs Podman for InfoMetis**
| Feature | Docker | Podman | InfoMetis Impact |
|---------|--------|---------|------------------|
| **Security** | Root daemon | Rootless | ✅ Podman better for enterprise |
| **k8s Compatibility** | Good | Native | ✅ Podman aligns with k0s strategy |
| **Pod Support** | No | Yes | ✅ Podman mirrors InfoMetis processing units |
| **Compose Support** | Native | Via podman-compose | ⚖️ Both work |
| **Learning Curve** | Familiar | Similar | ⚖️ Minimal difference |

### **Recommendation for InfoMetis**
**Podman preferred** for production alignment with k0s and security principles, but **Docker acceptable** for rapid prototyping if already installed.

## Development Benefits

### **Comprehensive Data Flow Testing**
- **Input validation** - Ensures data quality
- **Data enrichment** - Real-world join operations
- **Error handling** - Proper exception routing
- **Multiple outputs** - Different file formats and purposes
- **Monitoring** - Built-in NiFi provenance tracking

### **Realistic InfoMetis Use Case**
- Mirrors typical data processing workflows
- Demonstrates file-based data ingestion
- Shows transformation and enrichment patterns
- Provides error handling and monitoring capabilities
- Generates multiple output formats (CSV, JSON)

### **Development Workflow**
1. **Iterate on pipeline design** in NiFi UI
2. **Test with various data scenarios** (valid, invalid, edge cases)
3. **Monitor processing metrics** via NiFi dashboard
4. **Export pipeline template** for version control
5. **Scale to production** with container orchestration

## InfoMetis Integration Roadmap

### **Phase 1: Standalone Prototype** (Current)
- Docker-based NiFi with file processing
- Validates core data flow patterns
- Establishes development workflow
- **Success Criteria**: Working file-to-file pipeline with enrichment

### **Phase 2: Internal Communication**
- Integrate with Kafka for message streaming
- Add Elasticsearch for data storage/search
- Implement Processing Unit pattern (Kafka-NiFi-ES)
- **Success Criteria**: Complete internal data flow within InfoMetis boundary

### **Phase 3: Adaptation Layer**
- Replace file volumes with Traefik-managed external connections
- Add external database connectivity through adaptation layer
- Implement environment-agnostic configuration
- **Success Criteria**: Same NiFi core works in multiple deployment environments

### **Phase 4: Production Readiness**
- k0s/Kubernetes deployment via Kustomize + FluxCD
- Full observability and monitoring integration
- TDD infrastructure and automated testing
- **Success Criteria**: Production deployment with GitOps workflow

## Next Steps

### **Immediate (Phase 1)**
1. **Template export** - Save pipeline as reusable template
2. **Performance testing** - Measure throughput with larger datasets
3. **Basic monitoring** - Essential observability for development

### **Short-term (Phase 2)**
1. **Kafka integration** - Add message streaming to processing unit
2. **Elasticsearch integration** - Complete data processing pipeline
3. **Internal networking** - Service-to-service communication patterns

### **Medium-term (Phase 3)**
1. **Adaptation layer** - External connection abstraction
2. **Multi-environment** - k0s and shared cluster deployment
3. **Configuration templates** - Environment-specific overlays

### **Long-term (Phase 4)**
1. **GitOps deployment** - FluxCD + Kustomize automation
2. **Production hardening** - Security and resilience
3. **Operational tooling** - Complete monitoring and management

---

This prototype provides the foundation for InfoMetis data processing capabilities while maintaining architectural principles and enabling seamless evolution toward the complete InfoMetis platform.