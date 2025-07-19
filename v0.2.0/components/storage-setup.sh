#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Storage Setup Component
# Component script: Persistent storage configuration for InfoMetis

echo "💾 InfoMetis v0.2.0 - Storage Setup Component"
echo "============================================"
echo "Component: Persistent storage configuration for NiFi and Registry"
echo ""

# Function: Create storage class
create_storage_class() {
    echo "📋 Creating local storage class..."
    
    kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: false
reclaimPolicy: Retain
EOF

    echo "✅ Storage class created"
}

# Function: Create NiFi persistent volume
create_nifi_pv() {
    echo "🌊 Creating NiFi persistent volume..."
    
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-pv
  labels:
    app: nifi
    component: storage
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /var/lib/k0s/nifi-data
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: Exists
EOF

    echo "✅ NiFi persistent volume created"
}

# Function: Create Registry persistent volume
create_registry_pv() {
    echo "🗂️  Creating Registry persistent volume..."
    
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: registry-pv
  labels:
    app: nifi-registry
    component: storage
spec:
  capacity:
    storage: 5Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /var/lib/k0s/registry-data
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: Exists
EOF

    echo "✅ Registry persistent volume created"
}

# Function: Create host directories
create_host_directories() {
    echo "📁 Creating host storage directories..."
    
    # Create directories in the k0s container
    docker exec k0s-infometis mkdir -p /var/lib/k0s/nifi-data/{logs,conf,flowfile_repository,database_repository,content_repository,provenance_repository}
    docker exec k0s-infometis mkdir -p /var/lib/k0s/registry-data/{database,flow_storage,conf,logs}
    
    # Set proper permissions
    docker exec k0s-infometis chown -R 1000:1000 /var/lib/k0s/nifi-data
    docker exec k0s-infometis chown -R 1000:1000 /var/lib/k0s/registry-data
    
    echo "✅ Host directories created and permissions set"
}

# Function: Verify storage setup
verify_storage() {
    echo "🔍 Verifying storage setup..."
    
    # Check storage class
    if kubectl get storageclass local-storage >/dev/null 2>&1; then
        echo "✅ Storage class exists"
    else
        echo "❌ Storage class not found"
        return 1
    fi
    
    # Check persistent volumes
    if kubectl get pv nifi-pv >/dev/null 2>&1; then
        echo "✅ NiFi persistent volume exists"
    else
        echo "❌ NiFi persistent volume not found"
        return 1
    fi
    
    if kubectl get pv registry-pv >/dev/null 2>&1; then
        echo "✅ Registry persistent volume exists"
    else
        echo "❌ Registry persistent volume not found"
        return 1
    fi
    
    # Check host directories
    if docker exec k0s-infometis test -d /var/lib/k0s/nifi-data >/dev/null 2>&1; then
        echo "✅ NiFi host directory exists"
    else
        echo "❌ NiFi host directory not found"
        return 1
    fi
    
    if docker exec k0s-infometis test -d /var/lib/k0s/registry-data >/dev/null 2>&1; then
        echo "✅ Registry host directory exists"
    else
        echo "❌ Registry host directory not found"
        return 1
    fi
    
    return 0
}

# Function: Get storage status
get_storage_status() {
    echo "📊 Storage Status:"
    echo "=================="
    
    echo "Storage Classes:"
    kubectl get storageclass
    echo ""
    
    echo "Persistent Volumes:"
    kubectl get pv
    echo ""
    
    echo "Persistent Volume Claims:"
    kubectl get pvc -A
    echo ""
    
    echo "Host Directory Status:"
    echo "NiFi data directory:"
    docker exec k0s-infometis ls -la /var/lib/k0s/nifi-data/ 2>/dev/null || echo "  Directory not found"
    echo ""
    echo "Registry data directory:"
    docker exec k0s-infometis ls -la /var/lib/k0s/registry-data/ 2>/dev/null || echo "  Directory not found"
}

# Function: Cleanup storage
cleanup_storage() {
    echo "🧹 Cleaning up storage..."
    
    # Delete PVCs first (if they exist)
    kubectl delete pvc nifi-pvc -n infometis --ignore-not-found=true
    kubectl delete pvc registry-pvc -n infometis --ignore-not-found=true
    
    # Delete PVs
    kubectl delete pv nifi-pv --ignore-not-found=true
    kubectl delete pv registry-pv --ignore-not-found=true
    
    # Clean host directories
    docker exec k0s-infometis rm -rf /var/lib/k0s/nifi-data /var/lib/k0s/registry-data 2>/dev/null || true
    
    echo "✅ Storage cleanup complete"
}

# Function: Initialize storage for fresh deployment
initialize_storage() {
    echo "🚀 Initializing storage for fresh deployment..."
    
    create_storage_class
    create_host_directories
    create_nifi_pv
    create_registry_pv
    verify_storage
    
    echo "✅ Storage initialization complete"
}

# Main execution
main() {
    local operation="${1:-setup}"
    
    case "$operation" in
        "setup"|"init")
            initialize_storage
            ;;
        "verify")
            verify_storage
            ;;
        "status")
            get_storage_status
            ;;
        "cleanup")
            cleanup_storage
            ;;
        "class")
            create_storage_class
            ;;
        "directories")
            create_host_directories
            ;;
        "nifi-pv")
            create_nifi_pv
            ;;
        "registry-pv")
            create_registry_pv
            ;;
        *)
            echo "Usage: $0 [setup|verify|status|cleanup|class|directories|nifi-pv|registry-pv]"
            echo ""
            echo "Operations:"
            echo "  setup       - Complete storage setup (default)"
            echo "  init        - Alias for setup"
            echo "  verify      - Verify storage configuration"
            echo "  status      - Show storage status"
            echo "  cleanup     - Remove all storage components"
            echo "  class       - Create storage class only"
            echo "  directories - Create host directories only"
            echo "  nifi-pv     - Create NiFi PV only"
            echo "  registry-pv - Create Registry PV only"
            exit 1
            ;;
    esac
}

# Export functions for use by other scripts
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi