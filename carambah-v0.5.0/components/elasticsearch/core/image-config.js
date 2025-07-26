/**
 * InfoMetis v0.5.0 - Container Image Configuration
 * Central configuration for all container images used in the platform
 * v0.5.0 adds Kafka ecosystem components: Schema Registry, Flink, ksqlDB, Prometheus
 */

module.exports = {
    // All container images used in InfoMetis v0.5.0
    images: [
        // Core infrastructure (from v0.4.0)
        "k0sproject/k0s:latest",
        "traefik:v2.9", 
        "apache/nifi:1.23.2",
        "apache/nifi-registry:1.23.2",
        "elasticsearch:8.15.0",
        "grafana/grafana:10.2.0",
        "confluentinc/cp-kafka:7.5.0",
        "confluentinc/cp-kafka-rest:7.5.0",
        "provectuslabs/kafka-ui:latest",
        "busybox:1.35",
        
        // k0s system dependencies (required by Traefik kubectl deployment)
        "cloudnativelabs/kube-router:v1.3.2",
        "coredns/coredns:1.7.1", 
        "quay.io/k0sproject/apiserver-network-proxy-agent:0.0.32-k0s1",
        "quay.io/k0sproject/cni-node:0.1.0",
        "registry.k8s.io/kube-proxy:v1.23.17",
        "registry.k8s.io/metrics-server/metrics-server:v0.5.2",
        "registry.k8s.io/pause:3.5",
        
        // v0.5.0 Kafka ecosystem components
        "confluentinc/cp-schema-registry:7.5.0",     // Schema Registry
        "apache/flink:1.18-scala_2.12",             // Apache Flink
        "confluentinc/ksqldb-server:0.29.0",        // ksqlDB Server
        "confluentinc/ksqldb-cli:0.29.0",           // ksqlDB CLI
        "prom/prometheus:v2.47.0",                  // Prometheus
        "prom/alertmanager:v0.25.1",               // Alertmanager
        "prom/node-exporter:v1.6.1"                // Node Exporter
    ],

    // Image Pull Policy for cached deployments
    imagePullPolicy: "Never",

    // Cache directory
    cacheDir: "../cache"
};