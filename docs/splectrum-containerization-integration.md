[← Back to InfoMetis Home](../README.md)

# SPlectrum Containerization Integration

## Overview

This document captures the architectural discussion and implementation strategy for integrating SPlectrum as a containerized service within the InfoMetis ecosystem. SPlectrum will serve as both a computation engine and a platform for deploying SPL packages as microservices.

## Integration Vision

### SPlectrum's Role in InfoMetis
SPlectrum becomes a **first-class service** in the InfoMetis service platform abstraction layer:
- **Computation Engine**: Execute commands and batches for other services
- **Package Runtime**: Deploy SPL packages as containerized microservices
- **Interactive Development**: Persistent terminal sessions for development workflows
- **API Gateway**: Bridge between traditional services and SPL ecosystem

### Service Ecosystem Position
```
Traditional Services (Kubernetes)
    ↕ APIs
InfoMetis Service Mesh
    ↕ APIs  
SPlectrum Engine (Container)
    ↕ CLI/RPC
SPL Package Ecosystem
```

## Containerization Approaches

### Evolution Path

#### **Phase 1: Direct Command-Line Container (Immediate)**
Simple containerization with command execution patterns:

```dockerfile
FROM alpine:latest

# Install SPlectrum and dependencies
COPY spl /usr/local/bin/spl
COPY modules/ /spl/modules/
COPY packages/ /spl/packages/

# Create working directories
RUN mkdir -p /spl/data /spl/runtime/sessions

# Set up entrypoint for command execution
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /spl
ENTRYPOINT ["/entrypoint.sh"]
```

#### **Phase 2: HTTP API Wrapper (Short-term)**
RESTful interface around SPlectrum CLI:

```javascript
// Simple REST API that executes SPlectrum commands
app.post('/execute', async (req, res) => {
  const { command, args, workdir } = req.body;
  
  try {
    const result = await execCommand(`spl ${command}`, args, workdir);
    res.json({
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### **Phase 3: AVRO RPC Service (Future)**
High-performance, schema-driven communication:

```json
{
  "protocol": "SPlectrumEngine",
  "namespace": "com.splectrum.rpc",
  "types": [
    {
      "name": "Command",
      "type": "record",
      "fields": [
        {"name": "command", "type": "string"},
        {"name": "args", "type": {"type": "array", "items": "string"}},
        {"name": "workdir", "type": ["null", "string"], "default": null},
        {"name": "sessionId", "type": ["null", "string"], "default": null}
      ]
    },
    {
      "name": "ExecutionResult",
      "type": "record", 
      "fields": [
        {"name": "exitCode", "type": "int"},
        {"name": "stdout", "type": "string"},
        {"name": "stderr", "type": "string"},
        {"name": "duration", "type": "long"},
        {"name": "sessionId", "type": "string"}
      ]
    }
  ],
  "messages": {
    "execute": {
      "request": [{"name": "command", "type": "Command"}],
      "response": "ExecutionResult"
    },
    "executeBatch": {
      "request": [{"name": "batch", "type": "BatchJob"}],
      "response": "ExecutionResult"  
    }
  }
}
```

## Persistent Terminal Sessions

### WebSocket Terminal Implementation

```javascript
// websocket-terminal.js - Web-based terminal to SPlectrum
const WebSocket = require('ws');
const pty = require('node-pty');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  // Spawn SPlectrum shell session
  const splShell = pty.spawn('/usr/local/bin/spl', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: '/spl',
    env: process.env
  });

  // Pipe terminal output to WebSocket
  splShell.on('data', (data) => {
    ws.send(JSON.stringify({ type: 'output', data }));
  });

  // Pipe WebSocket input to terminal
  ws.on('message', (message) => {
    const { type, data } = JSON.parse(message);
    if (type === 'input') {
      splShell.write(data);
    }
  });

  // Handle session cleanup
  ws.on('close', () => {
    splShell.kill();
  });
});
```

### SSH Access Option

```dockerfile
FROM alpine:latest

# Install SPlectrum
COPY spl /usr/local/bin/spl
COPY modules/ /spl/modules/

# Install SSH server
RUN apk add --no-cache openssh-server bash
RUN ssh-keygen -A

# Create spl user with proper shell
RUN adduser -D -s /bin/bash spl
RUN echo "spl:splectrum" | chpasswd

# Set up SPlectrum environment for user
USER spl
WORKDIR /home/spl
RUN echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
RUN echo 'cd /spl' >> ~/.bashrc

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
```

### Multi-User Session Management

```javascript
// Session manager for multiple concurrent users
class SPlectrumSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(userId, workdir = '/spl') {
    const sessionId = `spl-${userId}-${Date.now()}`;
    const terminal = pty.spawn('/usr/local/bin/spl', [], {
      cwd: workdir,
      env: { ...process.env, SPL_SESSION_ID: sessionId }
    });
    
    this.sessions.set(sessionId, {
      terminal,
      userId,
      created: new Date(),
      lastActivity: new Date()
    });
    
    return sessionId;
  }

  attachToSession(sessionId, websocket) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    // Connect WebSocket to existing terminal
    session.terminal.on('data', data => websocket.send(data));
    websocket.on('message', data => session.terminal.write(data));
  }
}
```

## InfoMetis Service Integration

### Service Definition

```javascript
{
  "service": "splectrum-engine",
  "version": "0.6.1",
  "type": "computation-engine",
  "interfaces": {
    "rest": "http://splectrum:8080/api/v1",
    "websocket": "ws://splectrum:8080/terminal",
    "ssh": "ssh://spl@splectrum:22",
    "avro-rpc": "tcp://splectrum:9090"
  },
  "capabilities": [
    "command-execution",
    "batch-processing", 
    "package-management",
    "interactive-sessions",
    "file-operations"
  ]
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: splectrum-engine
  labels:
    infometis.service: splectrum-engine
    infometis.type: computation-engine
spec:
  replicas: 2
  selector:
    matchLabels:
      app: splectrum-engine
  template:
    metadata:
      labels:
        app: splectrum-engine
    spec:
      containers:
      - name: splectrum
        image: infometis/splectrum-engine:latest
        ports:
        - containerPort: 8080  # HTTP API
        - containerPort: 8081  # WebSocket Terminal
        - containerPort: 22    # SSH Access
        - containerPort: 9090  # AVRO RPC (future)
        volumeMounts:
        - name: spl-data
          mountPath: /spl/data
        - name: spl-sessions
          mountPath: /spl/runtime/sessions
        - name: spl-packages
          mountPath: /spl/packages
        env:
        - name: SPL_ENVIRONMENT
          value: "container"
        - name: SPL_LOG_LEVEL
          value: "info"
      volumes:
      - name: spl-data
        persistentVolumeClaim:
          claimName: splectrum-data
      - name: spl-sessions
        persistentVolumeClaim:
          claimName: splectrum-sessions
      - name: spl-packages
        persistentVolumeClaim:
          claimName: splectrum-packages
---
apiVersion: v1
kind: Service
metadata:
  name: splectrum-engine
  labels:
    infometis.service: splectrum-engine
spec:
  selector:
    app: splectrum-engine
  ports:
  - name: api
    port: 8080
    targetPort: 8080
  - name: terminal
    port: 8081
    targetPort: 8081
  - name: ssh
    port: 22
    targetPort: 22
  - name: avro-rpc
    port: 9090
    targetPort: 9090
```

## SPL Package as Microservice Pattern

### Container-Wrapped SPL Packages

```javascript
// Deploy SPL packages as microservices through SPlectrum
{
  "service": "data-transform-spl",
  "runtime": "splectrum-engine",
  "package": "data-transformation/v1.0.0",
  "deployment": {
    "type": "spl-package",
    "runtime_image": "infometis/splectrum-runtime:latest",
    "package_mount": "/spl/packages/data-transformation",
    "api_wrapper": "node /spl/api/wrapper.js"
  },
  "api": {
    "transform": "POST /api/v1/transform",
    "status": "GET /api/v1/status",
    "health": "GET /health"
  }
}
```

### SPL Package Containerization

```dockerfile
# Example: SPlectrum API package as containerized service
FROM infometis/splectrum-base:latest

# Copy specific SPL package
COPY data-transformation/ /spl/packages/data-transformation/

# Copy API wrapper for this package
COPY api-wrapper.js /spl/api/
COPY package.json /spl/api/
RUN cd /spl/api && npm install

# Expose API port
EXPOSE 8080

# Start API wrapper
CMD ["node", "/spl/api/api-wrapper.js"]
```

## Service Interaction Patterns

### NiFi → SPlectrum Integration

```java
// NiFi processor using HTTP API
Properties props = new Properties();
props.setProperty("URL", "http://splectrum-engine:8080/execute");
props.setProperty("HTTP Method", "POST");
props.setProperty("Request Body", 
    "{\"command\": \"data transform\", \"args\": [\"--input=${filename}\"]}");
```

### Kafka → SPlectrum Integration

```javascript
// Kafka consumer triggering SPlectrum processing
consumer.on('message', async (message) => {
  const response = await fetch('http://splectrum-engine:8080/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'data process',
      args: ['--input=' + message.value, '--output=/tmp/processed'],
      workdir: '/spl/runtime/kafka-session'
    })
  });
  
  const result = await response.json();
  // Process result and publish back to Kafka
});
```

## Development Workflow Integration

### Web Terminal Dashboard

```html
<!DOCTYPE html>
<html>
<head>
  <title>SPlectrum Development Console</title>
  <link rel="stylesheet" href="https://unpkg.com/xterm/css/xterm.css" />
</head>
<body>
  <div class="header">
    <h1>SPlectrum Development Console</h1>
    <div class="session-info">
      Session: <span id="session-id">connecting...</span>
      Status: <span id="status">initializing</span>
    </div>
  </div>
  
  <div id="terminal"></div>
  
  <div class="controls">
    <button onclick="newSession()">New Session</button>
    <button onclick="saveSession()">Save Session</button>
    <button onclick="loadSession()">Load Session</button>
  </div>

  <script src="https://unpkg.com/xterm/lib/xterm.js"></script>
  <script>
    const terminal = new Terminal({
      theme: { background: '#1e1e1e' },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, monospace'
    });
    terminal.open(document.getElementById('terminal'));
    
    const ws = new WebSocket('ws://splectrum-engine:8081/terminal');
    
    ws.onopen = () => {
      document.getElementById('status').textContent = 'connected';
    };
    
    ws.onmessage = (event) => {
      const { type, data, sessionId } = JSON.parse(event.data);
      if (type === 'output') {
        terminal.write(data);
      } else if (type === 'session') {
        document.getElementById('session-id').textContent = sessionId;
      }
    };
    
    terminal.onData((data) => {
      ws.send(JSON.stringify({ type: 'input', data }));
    });
    
    function newSession() {
      ws.send(JSON.stringify({ type: 'new_session' }));
    }
  </script>
</body>
</html>
```

## Performance and Scalability

### Container Resource Management

```yaml
# Resource limits for SPlectrum containers
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

### Horizontal Scaling

```yaml
# Horizontal Pod Autoscaler for SPlectrum
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: splectrum-engine-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: splectrum-engine
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Security Considerations

### Container Security

```dockerfile
# Security-hardened SPlectrum container
FROM alpine:latest

# Create non-root user
RUN adduser -D -s /bin/bash spluser
RUN mkdir -p /spl && chown spluser:spluser /spl

# Install SPlectrum with proper permissions
COPY --chown=spluser:spluser spl /usr/local/bin/spl
COPY --chown=spluser:spluser modules/ /spl/modules/

# Switch to non-root user
USER spluser
WORKDIR /spl

# Limited capabilities
ENTRYPOINT ["/usr/local/bin/spl"]
```

### Network Security

```yaml
# Network policies for SPlectrum
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: splectrum-network-policy
spec:
  podSelector:
    matchLabels:
      app: splectrum-engine
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: infometis-services
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 8081
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS
    - protocol: TCP
      port: 80   # HTTP
```

## Benefits and Advantages

### For SPlectrum
1. **Cloud Native**: Runs in modern container orchestration platforms
2. **Scalability**: Horizontal scaling based on demand
3. **Integration**: Standard APIs for service-to-service communication
4. **Monitoring**: Container-native observability and logging
5. **DevOps**: Standard deployment, versioning, and rollback capabilities

### For InfoMetis Ecosystem
1. **Unified Platform**: SPlectrum becomes part of the service mesh
2. **Hybrid Workloads**: Traditional services + SPL packages
3. **Developer Experience**: Familiar terminal access with cloud benefits
4. **API Economy**: SPL packages exposed as REST/RPC services
5. **Platform Abstraction**: Consistent deployment across environments

### For Development Workflow
1. **Interactive Development**: Persistent terminal sessions
2. **Collaborative Debugging**: Shared sessions and environments
3. **Rapid Prototyping**: Quick deployment and testing of SPL packages
4. **Version Control**: Container-based versioning and rollbacks
5. **Environment Consistency**: Development, staging, production parity

## Implementation Roadmap

### Phase 1: Basic Containerization (Immediate)
- [x] **Week 1-2**: Create basic SPlectrum container with CLI access
- [ ] **Week 3**: Implement simple HTTP API wrapper
- [ ] **Week 4**: Add persistent volume support for data and sessions
- [ ] **Week 5**: Deploy to InfoMetis development environment

### Phase 2: Enhanced Services (Month 2)
- [ ] **Week 6-7**: Implement WebSocket terminal sessions
- [ ] **Week 8**: Add SSH access option
- [ ] **Week 9**: Create multi-user session management
- [ ] **Week 10**: Integration testing with NiFi and other services

### Phase 3: Production Ready (Month 3)
- [ ] **Week 11-12**: Performance optimization and scaling
- [ ] **Week 13**: Security hardening and network policies
- [ ] **Week 14**: Monitoring and observability integration
- [ ] **Week 15**: Documentation and training materials

### Phase 4: Advanced Features (Month 4+)
- [ ] **Future**: AVRO RPC implementation
- [ ] **Future**: SPL package marketplace integration
- [ ] **Future**: AI-assisted development features
- [ ] **Future**: Edge computing deployment options

## Related Documentation

- **[InfoMetis Platform Evolution Strategy](infometis-platform-evolution-strategy.md)** - Overall platform vision
- **[InfoMetis Evolution Strategy](infometis-evolution-strategy.md)** - Component evolution approach
- **[Compositional Repository Architecture](compositional-repository-architecture.md)** - Multi-repository strategy
- **[SPlectrum Documentation](../../../spl1/README.md)** - Core SPlectrum platform

## Conclusion

Containerizing SPlectrum as a service within InfoMetis creates a powerful hybrid platform that combines the strengths of traditional cloud-native services with the flexibility and power of the SPL ecosystem. The persistent terminal session approach provides the best developer experience while maintaining the scalability and operational benefits of containerization.

This integration positions SPlectrum as a first-class computation engine within InfoMetis, enabling new patterns of service composition and creating a unified platform for both traditional and next-generation SPL-powered applications.