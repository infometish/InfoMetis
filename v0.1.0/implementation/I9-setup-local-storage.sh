#!/bin/bash
# step-08a-create-local-storage.sh
# Create local storage provisioner for PVC binding

set -eu

echo "💾 Step 8a: Creating Local Storage Provisioner"
echo "============================================="

echo "📋 Creating hostPath StorageClass..."

# Create StorageClass for hostPath volumes
cat > local-storage-class.yaml <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF

cp local-storage-class.yaml ../../../
docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f local-storage-class.yaml"

echo "✅ StorageClass created"

echo "📋 Creating PersistentVolumes for NiFi..."

# Create PersistentVolumes for all NiFi storage requirements
cat > nifi-pv.yaml <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-content-pv
  labels:
    type: local
spec:
  storageClassName: local-storage
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/nifi-content
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: Exists
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-database-pv
  labels:
    type: local
spec:
  storageClassName: local-storage
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/nifi-database
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: Exists
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-flowfile-pv
  labels:
    type: local
spec:
  storageClassName: local-storage
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/nifi-flowfile
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: Exists
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-provenance-pv
  labels:
    type: local
spec:
  storageClassName: local-storage
  capacity:
    storage: 3Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/nifi-provenance
    type: DirectoryOrCreate
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: Exists
EOF

cp nifi-pv.yaml ../../../
docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f nifi-pv.yaml"

echo "✅ PersistentVolumes created"

echo "📋 Creating directories in container..."
docker exec infometis mkdir -p /tmp/nifi-content /tmp/nifi-database /tmp/nifi-flowfile /tmp/nifi-provenance
docker exec infometis chmod 777 /tmp/nifi-content /tmp/nifi-database /tmp/nifi-flowfile /tmp/nifi-provenance

echo "✅ Storage directories created"

echo "📋 Checking storage resources..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get storageclass,pv"

# Clean up temporary files
rm -f local-storage-class.yaml nifi-pv.yaml

echo ""
echo "🎉 Local storage provisioner ready!"
echo "   StorageClass: local-storage"
echo "   PersistentVolumes: nifi-content-pv, nifi-database-pv, nifi-flowfile-pv, nifi-provenance-pv"
echo "   Host paths: /tmp/nifi-content, /tmp/nifi-database, /tmp/nifi-flowfile, /tmp/nifi-provenance"