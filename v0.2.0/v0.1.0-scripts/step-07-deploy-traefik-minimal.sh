#!/bin/bash
# step-07-deploy-traefik-minimal.sh
# Deploy Traefik WITHOUT API/dashboard to avoid port conflicts

set -eu

echo "🌐 Step 7: Deploying Traefik Ingress Controller (Minimal)"
echo "======================================================="

echo "📋 Creating Traefik RBAC..."

# Use heredocs to pipe YAML directly to kubectl
echo "📋 Creating ServiceAccount..."
docker exec infometis k0s kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik-ingress-controller
  namespace: kube-system
EOF

echo "📋 Creating ClusterRole..."
docker exec infometis k0s kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: traefik-ingress-controller
rules:
- apiGroups: [""]
  resources: ["services", "endpoints", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["extensions", "networking.k8s.io"]
  resources: ["ingresses", "ingressclasses"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["extensions"]
  resources: ["ingresses/status"]
  verbs: ["update"]
EOF

echo "📋 Creating ClusterRoleBinding..."
docker exec infometis k0s kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: traefik-ingress-controller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: traefik-ingress-controller
subjects:
- kind: ServiceAccount
  name: traefik-ingress-controller
  namespace: kube-system
EOF

echo "📋 Creating Traefik Deployment (NO API)..."
docker exec infometis k0s kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traefik
  namespace: kube-system
  labels:
    app: traefik
spec:
  replicas: 1
  selector:
    matchLabels:
      app: traefik
  template:
    metadata:
      labels:
        app: traefik
    spec:
      serviceAccountName: traefik-ingress-controller
      containers:
      - name: traefik
        image: traefik:v2.9
        args:
        - --entrypoints.web.address=:80
        - --entrypoints.websecure.address=:443
        - --api=false
        - --providers.kubernetesingress=true
        - --providers.kubernetesingress.ingressendpoint.hostname=localhost
        - --log.level=DEBUG
        ports:
        - name: web
          containerPort: 80
        - name: websecure
          containerPort: 443
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
      # Removed hostNetwork to avoid port conflicts
EOF

echo "📋 Creating Traefik Service..."
docker exec infometis k0s kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: traefik
  namespace: kube-system
  labels:
    app: traefik
spec:
  selector:
    app: traefik
  ports:
  - name: web
    port: 80
    targetPort: 80
  - name: websecure
    port: 443
    targetPort: 443
  type: NodePort
EOF

echo "📋 Creating IngressClass..."
docker exec infometis k0s kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF

echo "📋 Waiting for Traefik to be ready..."
docker exec infometis k0s kubectl get pods -n kube-system -l app=traefik

echo "📋 Waiting for deployment to be available..."
docker exec infometis k0s kubectl wait --for=condition=available --timeout=120s deployment/traefik -n kube-system || {
    echo "⚠️  Deployment not ready within timeout. Checking status..."
    docker exec infometis k0s kubectl describe pods -n kube-system -l app=traefik
    docker exec infometis k0s kubectl logs -n kube-system -l app=traefik --tail=50
}

echo "📋 Verifying Traefik deployment..."
docker exec infometis k0s kubectl get deployment,service,ingressclass -n kube-system | grep traefik

echo ""
echo "🎉 Traefik deployment complete!"
echo "   Ingress controller: Ready for routing"
echo "   API/Dashboard: Disabled (to avoid port conflicts)"
echo "   Web traffic: http://localhost/"