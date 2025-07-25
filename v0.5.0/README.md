# InfoMetis v0.5.0 - Kafka Ecosystem Platform

> 🚀 **Complete Kafka-centric data platform for rapid prototyping and development**

## Overview

InfoMetis v0.5.0 is a pre-integrated, single-command deployable data platform that provides a complete Kafka ecosystem with stream processing, data ingestion, storage, and visualization capabilities. Perfect for:

- **Proof of Concepts** - Rapidly prototype data pipelines
- **Development** - Local development environment
- **Learning** - Hands-on experience with modern data tools
- **Demos** - Showcase real-time data processing

## 🎯 Key Features

- **One-Command Deployment** - Full platform in ~15 minutes
- **Pre-Integrated Components** - Everything works out of the box
- **Visual Interfaces** - Web UIs for all components
- **Persistent Storage** - Data survives restarts
- **Container-Ready** - All images cached locally

## 📦 Components

| Component | Version | Purpose |
|-----------|---------|---------|
| **Apache Kafka** | 3.6 | Event streaming platform (KRaft mode) |
| **Apache NiFi** | 1.23.2 | Visual dataflow programming |
| **Apache Flink** | 1.18 | Distributed stream processing |
| **ksqlDB** | 0.29.0 | Streaming SQL engine |
| **Elasticsearch** | 7.17.10 | Search and analytics |
| **Grafana** | 10.0.3 | Dashboards and visualization |
| **Prometheus** | 2.47.0 | Metrics and monitoring |
| **Schema Registry** | Latest | Schema management |
| **Traefik** | 2.9 | Ingress controller |

## 🚀 Quick Start

### Prerequisites
- Docker installed and running
- 16GB RAM minimum
- 20GB free disk space
- Linux/MacOS/WSL2

### Installation

```bash
# Clone or navigate to InfoMetis
cd /home/herma/infometish/InfoMetis/v0.5.0

# Launch interactive console
node console.js

# Deploy everything:
# 1. Press 'K' → 'a' (Deploy Kubernetes)
# 2. Press 'D' → 'a' (Deploy all components)
```

Total deployment time: ~15 minutes

### Verify Installation

```bash
kubectl get pods -n infometis
```

All pods should show `Running` status.

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **NiFi** | http://localhost/nifi | admin / infometis2024 |
| **Kafka UI** | http://localhost/kafka-ui | - |
| **Flink UI** | http://localhost:8083 | - |
| **Grafana** | http://localhost/grafana | admin / admin |
| **Elasticsearch** | http://localhost/elasticsearch | - |
| **Prometheus** | http://localhost/prometheus | - |
| **ksqlDB** | Via CLI | - |
| **Traefik Dashboard** | http://localhost:8082 | - |

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get running in 5 minutes
- **[Prototyping Guide](docs/PROTOTYPING_GUIDE.md)** - Hands-on tutorials
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and data flows

### Component Guides
- **[Kafka Guide](docs/components/KAFKA_GUIDE.md)** - Topics, producers, consumers
- **[NiFi Guide](docs/components/NIFI_GUIDE.md)** - Flows, processors, integration
- **[Flink Guide](docs/components/FLINK_GUIDE.md)** - Stream processing, jobs

## 🎮 Interactive Console

The platform includes a powerful interactive console for management:

```
🚀 InfoMetis v0.5.0 Deployment Console
======================================

Main Menu:
P - Prerequisites (image caching)
K - Kubernetes Cluster 
D - Deployments
R - Remove Deployments
V - Validation and Testing
Q - Quit
```

### Key Operations
- **Full Deploy**: K → a, then D → a
- **Health Check**: V → 1
- **Clean Shutdown**: R → a, then K → 1

## 🔧 Common Tasks

### Create Kafka Topic
```bash
kubectl exec -it -n infometis kafka-0 -- \
  kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic my-events
```

### Submit Flink Job
```bash
kubectl cp my-job.jar infometis/flink-jobmanager-xxx:/tmp/
kubectl exec -it -n infometis deployment/flink-jobmanager -- \
  flink run /tmp/my-job.jar
```

### Query with ksqlDB
```bash
kubectl exec -it -n infometis deployment/ksqldb-server -- ksql
```

## 🏗️ Architecture

```
         Traefik Ingress (80/8082)
                  │
     ┌────────────┴────────────┐
     │                         │
Monitoring              Applications
(Prometheus,            (NiFi, Kafka UI,
 Grafana)               Flink UI)
     │                         │
     └────────────┬────────────┘
                  │
         Core Data Platform
    ┌─────┬─────┬─────┬─────┐
    │NiFi │Kafka│Flink│ksql │
    └──┬──┴──┬──┴──┬──┴──┬──┘
       │     │     │     │
       └─────┴─────┴─────┘
              │
        Elasticsearch
              │
        Kubernetes (k0s)
```

## 🚨 Troubleshooting

### Check Component Status
```bash
# All pods
kubectl get pods -n infometis

# Specific logs
kubectl logs -n infometis deployment/kafka
kubectl logs -n infometis deployment/flink-jobmanager
```

### Common Issues

1. **Pods Pending**: Usually PVC issues - check PersistentVolumes
2. **Can't Access UI**: Verify Traefik is running on port 80
3. **Kafka Connection Failed**: Use internal service names (kafka-service:9092)

## 🛠️ Development

### Project Structure
```
v0.5.0/
├── config/
│   ├── manifests/     # Kubernetes YAML files
│   └── console/       # Console configuration
├── implementation/    # Deployment scripts
├── lib/              # Utility libraries
├── docs/             # Documentation
└── console.js        # Main entry point
```

### Adding Components
1. Create manifest in `config/manifests/`
2. Add deployment script in `implementation/`
3. Update console configuration
4. Add to documentation

## 📋 Version History

- **v0.5.0** - Kafka ecosystem focus with Flink, ksqlDB, Schema Registry
- **v0.4.0** - NiFi, Elasticsearch, Grafana, Prometheus
- **v0.3.0** - Base platform with Kafka

## 🤝 Contributing

1. Test changes locally first
2. Update documentation
3. Verify interactive console works
4. Submit PR with description

## 📄 License

Copyright 2024 - Part of InfoMetis Project

---

**Quick Commands Reference:**

```bash
# Deploy
node console.js  # Then K→a, D→a

# Access Kafka
kubectl exec -it -n infometis kafka-0 -- bash

# Access NiFi
Browse to http://localhost/nifi

# Clean up
node console.js  # Then R→a, K→1
```

💡 **Support**: For issues, check component logs first, then see troubleshooting guide.