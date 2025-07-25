# InfoMetis v0.5.0 - Quick Start Guide

> ⚡ **Get up and running in 5 minutes**

## Prerequisites

- Docker installed and running
- 16GB RAM minimum
- 20GB free disk space

## 🚀 Launch InfoMetis

```bash
cd /home/herma/infometish/InfoMetis/v0.5.0
node console.js
```

### Step 1: Deploy Kubernetes + Platform

1. Press **K** (Kubernetes Cluster)
2. Press **a** (Auto execute all steps)
3. Wait ~3 minutes

### Step 2: Deploy Applications  

1. Press **D** (Deployments)
2. Press **a** (Auto execute all steps)
3. Wait ~10 minutes

## ✅ Verify Installation

```bash
kubectl get pods -n infometis
```

You should see all pods in `Running` state.

## 🌐 Access Applications

| Application | URL | Credentials |
|------------|-----|-------------|
| **NiFi** | http://localhost/nifi | admin / infometis2024 |
| **Kafka UI** | http://localhost/kafka-ui | - |
| **Flink** | http://localhost:8083 | - |
| **Grafana** | http://localhost/grafana | admin / admin |
| **Elasticsearch** | http://localhost/elasticsearch | - |
| **Prometheus** | http://localhost/prometheus | - |

## 🎯 Your First Data Pipeline

### 1. Create Kafka Topic

```bash
kubectl exec -it -n infometis kafka-0 -- \
  kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic quickstart \
  --partitions 1
```

### 2. Send Test Message

```bash
kubectl exec -it -n infometis kafka-0 -- \
  kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic quickstart
```

Type: `Hello InfoMetis!` and press Enter, then Ctrl+C

### 3. Verify Message

Open http://localhost/kafka-ui → Topics → quickstart → Messages

## 🛑 Shutdown

```bash
node console.js
```

1. Press **R** (Remove Deployments)
2. Press **a** (Remove all)
3. Press **K** → **1** (Complete teardown)

## 💡 Next Steps

- Read the [Prototyping Guide](PROTOTYPING_GUIDE.md) for detailed tutorials
- Explore [Architecture Overview](ARCHITECTURE.md)
- Check [Component Guides](components/) for specific services

---

**Need help?** All services have health endpoints:
- Kafka: `http://localhost/kafka/brokers`
- Flink: `http://localhost:8083/jobs`
- Elasticsearch: `http://localhost/elasticsearch/_cluster/health`