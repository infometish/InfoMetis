#!/bin/bash

# Busybox Debug Pod Utilities
# Common debugging patterns using busybox:1.35

set -e

NAMESPACE=${1:-default}
POD_NAME=${2:-busybox-debug-$(date +%s)}

echo "=== Busybox Debug Utilities ==="
echo "Namespace: $NAMESPACE"
echo "Pod Name: $POD_NAME"
echo

create_debug_pod() {
    echo "Creating debug pod..."
    kubectl run $POD_NAME \
        --image=busybox:1.35 \
        --image-pull-policy=Never \
        --namespace=$NAMESPACE \
        --restart=Never \
        --rm -it \
        --command -- sh
}

create_network_debug_pod() {
    echo "Creating network debug pod..."
    kubectl run $POD_NAME-network \
        --image=busybox:1.35 \
        --image-pull-policy=Never \
        --namespace=$NAMESPACE \
        --restart=Never \
        --rm -it \
        --command -- sh -c "
        echo 'Network Debug Commands:'
        echo '- ping <hostname>'
        echo '- nslookup <hostname>'
        echo '- wget -q -O- <url>'
        echo '- netstat -tuln'
        echo
        sh"
}

create_volume_debug_pod() {
    local volume_name=$3
    local mount_path=$4
    
    if [[ -z "$volume_name" || -z "$mount_path" ]]; then
        echo "Usage: $0 volume <namespace> <pod-name> <volume-name> <mount-path>"
        exit 1
    fi
    
    echo "Creating volume debug pod..."
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: $POD_NAME-volume
  namespace: $NAMESPACE
spec:
  containers:
  - name: debug
    image: busybox:1.35
    imagePullPolicy: Never
    command: ['sleep', '3600']
    volumeMounts:
    - name: debug-volume
      mountPath: $mount_path
  volumes:
  - name: debug-volume
    persistentVolumeClaim:
      claimName: $volume_name
  restartPolicy: Never
EOF
    
    echo "Pod created. Access with:"
    echo "kubectl exec -it $POD_NAME-volume -n $NAMESPACE -- sh"
}

case "${1:-interactive}" in
    "network")
        create_network_debug_pod
        ;;
    "volume")
        create_volume_debug_pod "$@"
        ;;
    "interactive"|*)
        create_debug_pod
        ;;
esac