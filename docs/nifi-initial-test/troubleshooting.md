# NiFi Troubleshooting Guide

## Common Issues and Solutions

This document covers troubleshooting issues encountered during NiFi deployment and operation, based on our prototype testing experience.

## Container and Deployment Issues

### 1. Container Won't Start

**Symptoms**:
- Container exits immediately
- No response on ports 8080/8443
- Docker compose shows container as "exited"

**Diagnosis**:
```bash
# Check container status
docker compose ps

# View container logs
docker compose logs nifi

# Check for port conflicts
netstat -tlnp | grep :8080
netstat -tlnp | grep :8443
```

**Common Causes & Solutions**:

**Port Conflicts**:
```bash
# Find process using port
sudo lsof -i :8080
sudo lsof -i :8443

# Kill conflicting process or change ports in docker-compose.yml
ports:
  - "8081:8080"  # Use different host port
  - "8444:8443"
```

**Insufficient Memory**:
```yaml
# Add memory limits to docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
    reservations:
      memory: 2G
```

**Volume Permission Issues**:
```bash
# Fix directory permissions
sudo chown -R 1000:1000 ./data/nifi/
chmod -R 755 ./data/nifi/
```

### 2. Slow Container Startup

**Symptoms**:
- Container takes >2 minutes to start
- Health check failures
- Long application initialization

**Solutions**:

**Increase Health Check Timeout**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/nifi"]
  interval: 60s      # Increase interval
  timeout: 30s       # Increase timeout
  retries: 5         # More retries
  start_period: 90s  # Add startup grace period
```

**JVM Memory Tuning**:
```yaml
environment:
  - NIFI_JVM_HEAP_INIT=1g
  - NIFI_JVM_HEAP_MAX=2g
  - NIFI_JVM_GC_ARGS=-XX:+UseG1GC
```

## Authentication and Access Issues

### 3. Cannot Access Web UI

**Symptoms**:
- Browser shows "connection refused"
- SSL certificate errors
- Authentication failures

**Diagnosis**:
```bash
# Test HTTP endpoint
curl -I http://localhost:8080/nifi

# Test HTTPS endpoint
curl -k -I https://localhost:8443/nifi

# Check container networking
docker compose exec nifi netstat -tlnp
```

**Solutions**:

**SSL Certificate Issues**:
- **Browser**: Accept security warning for self-signed certificate
- **curl**: Use `-k` flag to ignore certificate errors
- **Production**: Use proper SSL certificates

**Wrong URL/Port**:
- **Correct URL**: `https://localhost:8443/nifi` (note HTTPS and port)
- **HTTP Redirect**: Port 8080 redirects to HTTPS 8443

**Container Not Ready**:
```bash
# Wait for application startup
docker compose logs nifi | grep "Started Application"

# Check health status
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

### 4. Authentication Token Issues

**Symptoms**:
- API returns 401 Unauthorized
- Token expired errors
- Invalid credentials

**Solutions**:

**Get Fresh Token**:
```bash
# Verify credentials
TOKEN=$(curl -k -X POST \
  'https://localhost:8443/nifi-api/access/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=adminpassword')

echo "Token length: ${#TOKEN}"
```

**Token Expiration**:
- **Default**: Tokens expire after 8 hours
- **Solution**: Refresh token or re-authenticate
- **Check**: JWT payload contains expiration time

**Credential Verification**:
```bash
# Verify environment variables are set
docker compose exec nifi env | grep SINGLE_USER_CREDENTIALS
```

## Pipeline Creation Issues

### 5. Processor Validation Errors

**Symptoms**:
- Processors show "INVALID" status
- Cannot start processors
- Red validation indicators in UI

**Common Validation Errors**:

**Missing Required Properties**:
```bash
# Check processor validation status
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$PROCESSOR_ID" | \
  jq '.component.validationErrors'

# Example fix for GetFile processor
{
  "properties": {
    "Input Directory": "/opt/nifi/input"  # Required property
  }
}
```

**Unconnected Relationships**:
```bash
# Auto-terminate unused relationships
{
  "config": {
    "autoTerminatedRelationships": ["failure"]
  }
}
```

**Invalid Property Values**:
```bash
# Check property descriptors for valid values
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$PROCESSOR_ID" | \
  jq '.component.config.descriptors'
```

### 6. Connection Issues

**Symptoms**:
- Cannot create connections between processors
- Connection validation errors
- FlowFiles stuck in queues

**Solutions**:

**Relationship Mismatch**:
```bash
# Check available relationships
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$PROCESSOR_ID" | \
  jq '.component.relationships[].name'

# Use correct relationship names in connection
{
  "selectedRelationships": ["success"]  # Must match available relationships
}
```

**Invalid Processor References**:
```bash
# Verify processor IDs exist
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$SOURCE_ID"

curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$DEST_ID"
```

## File Processing Issues

### 7. Files Not Being Processed

**Symptoms**:
- Files remain in input directory
- No FlowFiles in NiFi queues
- Processors running but no activity

**Diagnosis**:
```bash
# Check input directory from container perspective
docker compose exec nifi ls -la /opt/nifi/input/

# Check file permissions
docker compose exec nifi ls -la /opt/nifi/input/sample_data.csv

# Monitor processor statistics
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://localhost:8443/nifi-api/processors/$GETFILE_ID" | \
  jq '.status.aggregateSnapshot'
```

**Common Causes & Solutions**:

**File Permissions**:
```bash
# Fix file permissions on host
chmod 644 ./data/nifi/input/*
chown $USER:$USER ./data/nifi/input/*
```

**File Filter Configuration**:
```bash
# Check GetFile filter settings
{
  "properties": {
    "File Filter": "[^\\.].*",      # Default: exclude hidden files
    "Ignore Hidden Files": "true"   # Skip .files
  }
}

# For CSV files specifically
{
  "properties": {
    "File Filter": ".*\\.csv$"      # Only process .csv files
  }
}
```

**Minimum File Age**:
```bash
# Files might be too "young" to process
{
  "properties": {
    "Minimum File Age": "0 sec"     # Process immediately
  }
}
```

**Directory Path Issues**:
```bash
# Verify volume mount path
docker compose exec nifi ls -la /opt/nifi/
# Should show: input/ and output/ directories

# Check volume mapping in docker-compose.yml
volumes:
  - ./data/nifi/input:/opt/nifi/input     # Host:Container mapping
```

### 8. Output Files Not Appearing

**Symptoms**:
- Files processed but not written to output
- PutFile processor shows activity but no files
- Output directory empty

**Solutions**:

**Output Directory Configuration**:
```bash
# Verify PutFile configuration
{
  "properties": {
    "Directory": "/opt/nifi/output",           # Correct path
    "Create Missing Directories": "true"       # Auto-create directories
  }
}
```

**Permission Issues**:
```bash
# Check output directory permissions
docker compose exec nifi ls -la /opt/nifi/output/
docker compose exec nifi touch /opt/nifi/output/test.txt
```

**Conflict Resolution**:
```bash
# Handle file conflicts
{
  "properties": {
    "Conflict Resolution Strategy": "replace"  # Overwrite existing files
  }
}
```

## Performance Issues

### 9. Slow File Processing

**Symptoms**:
- Long processing times for small files
- High CPU usage
- Memory consumption issues

**Optimization**:

**Processor Scheduling**:
```bash
# Reduce polling interval for GetFile
{
  "config": {
    "schedulingPeriod": "1 sec"    # More frequent checking
  }
}
```

**Batch Processing**:
```bash
# Increase batch size for GetFile
{
  "properties": {
    "Batch Size": "50"             # Process more files per cycle
  }
}
```

**JVM Tuning**:
```yaml
environment:
  - NIFI_JVM_HEAP_MAX=4g
  - NIFI_JVM_GC_ARGS=-XX:+UseG1GC -XX:MaxGCPauseMillis=200
```

### 10. Queue Backlog Issues

**Symptoms**:
- FlowFiles accumulating in queues
- Back pressure warnings
- Processors unable to process

**Solutions**:

**Increase Queue Limits**:
```bash
{
  "component": {
    "backPressureObjectThreshold": 10000,      # More objects
    "backPressureDataSizeThreshold": "1 GB"    # More data
  }
}
```

**Parallel Processing**:
```bash
# Increase concurrent tasks
{
  "config": {
    "concurrentlySchedulableTaskCount": 5      # More threads
  }
}
```

## WSL-Specific Issues

### 11. WSL Docker Integration Issues

**Symptoms** (from our experience):
- k0s socket connectivity problems
- Volume mount permission issues
- Network connectivity problems

**Solutions**:

**Use Docker Desktop WSL2 Backend**:
- Enable WSL2 integration in Docker Desktop
- Use Linux filesystem paths, not Windows paths

**Volume Mount Paths**:
```yaml
# Use relative paths from WSL2 Linux filesystem
volumes:
  - ./data/nifi/input:/opt/nifi/input    # Correct
  - /mnt/c/data/nifi:/opt/nifi/input     # Avoid Windows paths
```

**File System Performance**:
```bash
# Work from Linux filesystem for better performance
cd ~/projects/InfoMetis/    # Not /mnt/c/Users/...
```

## Monitoring and Debugging

### 12. Debug Mode Configuration

**Enable Debug Logging**:
```yaml
environment:
  - NIFI_LOG_LEVEL=DEBUG
  - NIFI_APP_LOG_LEVEL=DEBUG
```

**Log File Locations**:
```bash
# Application logs
docker compose exec nifi tail -f /opt/nifi/nifi-current/logs/nifi-app.log

# Bootstrap logs
docker compose exec nifi tail -f /opt/nifi/nifi-current/logs/nifi-bootstrap.log

# User logs
docker compose exec nifi tail -f /opt/nifi/nifi-current/logs/nifi-user.log
```

### 13. Health Check Scripts

**Container Health Check**:
```bash
#!/bin/bash
# health-check.sh

CONTAINER_NAME="infometis-nifi"

# Check container status
STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null || echo "not-found")

case $STATUS in
    "healthy")
        echo "✅ Container is healthy"
        ;;
    "unhealthy")
        echo "❌ Container is unhealthy"
        docker compose logs nifi --tail=20
        ;;
    "starting")
        echo "⏳ Container is starting..."
        ;;
    "not-found")
        echo "❌ Container not found"
        ;;
esac
```

**API Health Check**:
```bash
#!/bin/bash
# api-health-check.sh

TOKEN=$(curl -k -s -X POST \
  'https://localhost:8443/nifi-api/access/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=adminpassword')

if [ ${#TOKEN} -gt 100 ]; then
    echo "✅ API authentication successful"
    
    # Check system status
    SYSTEM_STATUS=$(curl -k -s -H "Authorization: Bearer $TOKEN" \
      'https://localhost:8443/nifi-api/system-diagnostics' | \
      jq -r '.systemDiagnostics.aggregateSnapshot.totalNonHeapBytes')
    
    echo "✅ System diagnostics accessible: $SYSTEM_STATUS bytes"
else
    echo "❌ API authentication failed"
fi
```

## Recovery Procedures

### 14. Complete Reset

**When to Use**: Corrupted state, persistent issues

```bash
#!/bin/bash
# reset-nifi.sh - Complete NiFi reset

echo "Stopping NiFi container..."
docker compose down

echo "Removing volumes..."
docker volume rm infometis_nifi_database_repository
docker volume rm infometis_nifi_flowfile_repository
docker volume rm infometis_nifi_content_repository
docker volume rm infometis_nifi_provenance_repository

echo "Cleaning data directories..."
rm -rf ./data/nifi/output/*

echo "Starting fresh NiFi instance..."
docker compose up -d

echo "Waiting for startup..."
sleep 30

echo "✅ NiFi reset complete"
```

### 15. Backup and Restore

**Backup Important Data**:
```bash
#!/bin/bash
# backup-nifi.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup docker volumes
docker run --rm -v infometis_nifi_database_repository:/source:ro \
  -v "$(pwd)/$BACKUP_DIR":/backup alpine \
  tar czf /backup/database_repository.tar.gz -C /source .

# Backup configuration
docker compose exec nifi tar czf /backup/conf.tar.gz -C /opt/nifi/nifi-current/conf .

echo "✅ Backup completed: $BACKUP_DIR"
```

This troubleshooting guide covers the most common issues encountered during NiFi deployment and operation, providing practical solutions based on real-world testing experience.