/**
 * InfoMetis v0.5.0 - NiFi Registry Component Image Configuration
 * Container images required for NiFi Registry component
 */

module.exports = {
    // Container images used by NiFi Registry component
    images: [
        "apache/nifi-registry:1.23.2",
        "busybox:1.35"
    ],

    // Image Pull Policy for cached deployments
    imagePullPolicy: "Never",

    // Cache directory
    cacheDir: "../cache"
};