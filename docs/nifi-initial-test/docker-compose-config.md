# Docker Compose Configuration

## Configuration File: docker-compose.yml

```yaml
version: '3.8'

services:
  nifi:
    image: apache/nifi:latest
    container_name: infometis-nifi
    ports:
      - "8080:8080"  # NiFi web UI
      - "8443:8443"  # NiFi secure web UI
    environment:
      - SINGLE_USER_CREDENTIALS_USERNAME=admin
      - SINGLE_USER_CREDENTIALS_PASSWORD=adminpassword
      - NIFI_WEB_HTTP_PORT=8080
    volumes:
      - ./data/nifi/input:/opt/nifi/input
      - ./data/nifi/output:/opt/nifi/output
      - nifi_database_repository:/opt/nifi/nifi-current/database_repository
      - nifi_flowfile_repository:/opt/nifi/nifi-current/flowfile_repository
      - nifi_content_repository:/opt/nifi/nifi-current/content_repository
      - nifi_provenance_repository:/opt/nifi/nifi-current/provenance_repository
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/nifi"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  nifi_database_repository:
  nifi_flowfile_repository:
  nifi_content_repository:
  nifi_provenance_repository:
```

## Configuration Analysis

### Service Definition

#### Base Image
- **Image**: `apache/nifi:latest`
- **Tag Strategy**: Latest for prototype (consider pinning for production)
- **Size**: ~745MB compressed
- **Base OS**: OpenJDK runtime environment

#### Container Naming
- **Name**: `infometis-nifi`
- **Purpose**: Clear identification in multi-container environments
- **Namespace**: Prefixed with project name for organization

### Port Mapping Strategy

#### HTTP Port (8080)
```yaml
- "8080:8080"  # NiFi web UI
```
- **Purpose**: HTTP access (redirects to HTTPS)
- **Usage**: Health checks and basic connectivity
- **Security**: Automatically redirects to secure port

#### HTTPS Port (8443)
```yaml
- "8443:8443"  # NiFi secure web UI
```
- **Purpose**: Primary UI access
- **Protocol**: HTTPS with self-signed certificates
- **Authentication**: Single-user mode

### Environment Variables

#### Authentication Configuration
```yaml
- SINGLE_USER_CREDENTIALS_USERNAME=admin
- SINGLE_USER_CREDENTIALS_PASSWORD=adminpassword
```
- **Mode**: Single-user authentication
- **Security**: Basic credentials for development
- **Production Note**: Should use secure credential management

#### HTTP Port Override
```yaml
- NIFI_WEB_HTTP_PORT=8080
```
- **Purpose**: Explicit port configuration
- **Default**: Matches NiFi standard configuration
- **Health Check**: Enables HTTP health check endpoint

### Volume Management

#### Data Directories (Host Mounted)
```yaml
- ./data/nifi/input:/opt/nifi/input
- ./data/nifi/output:/opt/nifi/output
```
- **Purpose**: File processing input/output
- **Persistence**: Files persist across container restarts
- **Access**: Read/write access for file processing workflows

#### Repository Storage (Docker Volumes)
```yaml
- nifi_database_repository:/opt/nifi/nifi-current/database_repository
- nifi_flowfile_repository:/opt/nifi/nifi-current/flowfile_repository
- nifi_content_repository:/opt/nifi/nifi-current/content_repository
- nifi_provenance_repository:/opt/nifi/nifi-current/provenance_repository
```

**Database Repository**:
- **Purpose**: NiFi configuration and metadata
- **Size**: Small (MB range)
- **Criticality**: Contains flow definitions

**FlowFile Repository**:
- **Purpose**: FlowFile metadata and state
- **Size**: Grows with active processing
- **Performance**: Affects processing speed

**Content Repository**:
- **Purpose**: Actual file content storage
- **Size**: Largest repository (GB+ potential)
- **Cleanup**: Automatic with configurable retention

**Provenance Repository**:
- **Purpose**: Data lineage and audit trail
- **Size**: Moderate (hundreds of MB)
- **Retention**: Configurable historical data

### Container Management

#### Restart Policy
```yaml
restart: unless-stopped
```
- **Behavior**: Automatic restart on failure
- **Exception**: Manual stop commands
- **Use Case**: Development environment resilience

#### Health Check
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/nifi"]
  interval: 30s
  timeout: 10s
  retries: 3
```
- **Method**: HTTP GET to health endpoint
- **Frequency**: Every 30 seconds
- **Timeout**: 10-second response limit
- **Failure Threshold**: 3 consecutive failures

## Volume Configuration Details

### Named Volumes
```yaml
volumes:
  nifi_database_repository:
  nifi_flowfile_repository:
  nifi_content_repository:
  nifi_provenance_repository:
```

**Advantages**:
- Persist across container recreation
- Docker-managed storage location
- Automatic cleanup on volume removal
- Performance optimization for container storage

**Location**: Stored in Docker's volume directory (typically `/var/lib/docker/volumes/`)

### Host-Mounted Volumes
```yaml
- ./data/nifi/input:/opt/nifi/input
- ./data/nifi/output:/opt/nifi/output
```

**Advantages**:
- Direct host file system access
- Easy file management from host
- Integration with external file systems
- Backup and monitoring from host side

**Permissions**: Container processes run as root, ensuring read/write access

## Production Considerations

### Security Enhancements
```yaml
# Example production security
environment:
  - NIFI_SENSITIVE_PROPS_KEY=${NIFI_SENSITIVE_PROPS_KEY}
  - NIFI_SECURITY_USER_AUTHORIZER=ldap-provider
  - NIFI_SECURITY_USER_LOGIN_IDENTITY_PROVIDER=ldap-provider
```

### Resource Limits
```yaml
# Example resource constraints
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
    reservations:
      cpus: '1.0'
      memory: 2G
```

### Network Security
```yaml
# Example network isolation
networks:
  nifi-network:
    driver: bridge
    internal: true
```

### Volume Backup Strategy
```yaml
# Example backup volume
- ./backups/nifi:/opt/nifi/backup
```

## Customization Options

### Memory Configuration
```yaml
environment:
  - NIFI_JVM_HEAP_INIT=1g
  - NIFI_JVM_HEAP_MAX=2g
```

### Cluster Configuration
```yaml
environment:
  - NIFI_CLUSTER_IS_NODE=true
  - NIFI_CLUSTER_NODE_PROTOCOL_PORT=11443
  - NIFI_ZK_CONNECT_STRING=zookeeper:2181
```

### SSL Certificate Management
```yaml
volumes:
  - ./certs/keystore.jks:/opt/nifi/nifi-current/conf/keystore.jks
  - ./certs/truststore.jks:/opt/nifi/nifi-current/conf/truststore.jks
```

## Troubleshooting Configuration

### Common Issues

**Port Conflicts**:
```bash
# Check port usage
netstat -tlnp | grep :8080
netstat -tlnp | grep :8443
```

**Volume Permission Issues**:
```bash
# Fix directory permissions
chmod -R 755 ./data/nifi/
chown -R $USER:$USER ./data/nifi/
```

**Memory Issues**:
```yaml
# Increase memory allocation
environment:
  - NIFI_JVM_HEAP_MAX=4g
```

### Validation Commands
```bash
# Validate configuration
docker compose config

# Check volume mounts
docker compose exec nifi ls -la /opt/nifi/input

# Monitor resource usage
docker stats infometis-nifi

# View detailed container info
docker inspect infometis-nifi
```

## Configuration Evolution

### Development → Production Path
1. **Pin Image Version**: Replace `latest` with specific tag
2. **Secure Credentials**: Use Docker secrets or external vault
3. **Resource Limits**: Add CPU and memory constraints
4. **Network Isolation**: Configure custom networks
5. **SSL Certificates**: Use proper CA-signed certificates
6. **Backup Strategy**: Implement volume backup automation
7. **Monitoring**: Add logging and metrics collection
8. **High Availability**: Configure clustering for production scale