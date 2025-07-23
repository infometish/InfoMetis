/**
 * InfoMetis v0.4.0 - Container Image Configuration
 * Central configuration for all container images used in the platform
 */

module.exports = {
    // All container images used in InfoMetis v0.4.0
    images: [
        "k0sproject/k0s:latest",
        "traefik:v2.9", 
        "apache/nifi:1.23.2",
        "apache/nifi-registry:1.23.2",
        "elasticsearch:8.15.0"
    ],

    // Image Pull Policy for cached deployments
    imagePullPolicy: "Never",

    // Cache directory
    cacheDir: "../cache/images"
};