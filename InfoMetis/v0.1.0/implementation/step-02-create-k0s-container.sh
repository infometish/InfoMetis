#!/bin/bash
# step-02-create-k0s-container.sh
# Create k0s container with proper configuration

set -eu

CLUSTER_NAME="infometis"

echo "🚀 Step 2: Creating k0s Container"
echo "=================================="

echo "📋 Creating k0s container '$CLUSTER_NAME'..."

# Create k0s container
docker run -d --name "$CLUSTER_NAME" \
    --hostname "$CLUSTER_NAME" \
    --privileged \
    --volume /var/lib/k0s \
    --volume /var/lib/containerd \
    --volume /var/lib/etcd \
    --volume /run/k0s \
    --volume /sys/fs/cgroup:/sys/fs/cgroup:rw \
    --cgroupns=host \
    --restart=unless-stopped \
    --network=host \
    --pid=host \
    --ipc=host \
    --security-opt=apparmor:unconfined \
    --security-opt=seccomp:unconfined \
    --tmpfs=/tmp \
    --tmpfs=/var/logs \
    --tmpfs=/var/run \
    --tmpfs=/var/lib/containerd/io.containerd.grpc.v1.cri/sandboxes \
    --tmpfs=/var/lib/containerd/io.containerd.runtime.v2.task/k8s.io \
    --tmpfs=/var/lib/containerd/tmpmounts \
    --tmpfs=/var/lib/kubelet/pods \
    --tmpfs=/var/lib/kubelet/plugins \
    --tmpfs=/var/lib/kubelet/plugins_registry \
    --tmpfs=/var/lib/k0s/run \
    --tmpfs=/run/k0s \
    --tmpfs=/run/containerd \
    --tmpfs=/run/dockershim.sock \
    --tmpfs=/var/run/secrets/kubernetes.io/serviceaccount \
    --tmpfs=/var/lib/calico \
    --tmpfs=/var/run/calico \
    --tmpfs=/var/lib/cni \
    --tmpfs=/var/run/netns \
    --tmpfs=/var/lib/dockershim \
    --tmpfs=/var/run/docker.sock \
    --tmpfs=/var/run/docker \
    --tmpfs=/var/lib/docker \
    --tmpfs=/var/lib/containers \
    --tmpfs=/tmp/k0s \
    --publish 6443:6443 \
    --publish 80:80 \
    --publish 443:443 \
    --publish 8080:8080 \
    --publish 10249:10249 \
    --publish 10250:10250 \
    --publish 10251:10251 \
    --publish 10252:10252 \
    --publish 10253:10253 \
    --publish 10254:10254 \
    --publish 10255:10255 \
    --publish 10256:10256 \
    --publish 10257:10257 \
    --publish 10258:10258 \
    --publish 10259:10259 \
    --publish 2379:2379 \
    --publish 2380:2380 \
    --publish 6060:6060 \
    --publish 9090:9090 \
    --publish 9100:9100 \
    --publish 9443:9443 \
    k0sproject/k0s:latest

echo "✅ k0s container created successfully"

echo "📋 Checking container status..."
if ! docker ps --format "{{.Names}}" | grep -q "^${CLUSTER_NAME}$"; then
    echo "❌ Container not running"
    exit 1
fi

echo "✅ Container is running"

echo ""
echo "🎉 k0s container ready!"
echo "   Container: $CLUSTER_NAME"
echo "   Status: Running"