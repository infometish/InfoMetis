/**
 * InfoMetis v0.5.0 - Prometheus Container Image Configuration
 * Central configuration for Prometheus monitoring stack images
 */

module.exports = {
    // Prometheus monitoring stack images
    images: [
        "prom/prometheus:v2.47.0",                  // Prometheus Server
        "prom/alertmanager:v0.25.1",               // Alertmanager
        "prom/node-exporter:v1.6.1",              // Node Exporter
        "busybox:1.35"                             // Init container for permissions
    ],

    // Image Pull Policy for cached deployments
    imagePullPolicy: "Never",

    // Cache directory
    cacheDir: "../cache"
};