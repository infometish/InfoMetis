#!/bin/bash
# step-07-deploy-traefik.sh
# Deploy Traefik ingress controller with debugging

set -eu

echo "🌐 Step 7: Deploying Traefik Ingress Controller"
echo "==============================================="

echo "📋 Creating Traefik RBAC..."

# Create ServiceAccount
cat > /tmp/traefik-sa.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik-ingress-controller
  namespace: kube-system
EOF

docker exec infometis k0s kubectl apply -f /tmp/traefik-sa.yaml

# Create ClusterRole
cat > /tmp/traefik-clusterrole.yaml <<EOF
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

docker exec infometis k0s kubectl apply -f /tmp/traefik-clusterrole.yaml

# Create ClusterRoleBinding
cat > /tmp/traefik-clusterrolebinding.yaml <<EOF
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

docker exec infometis k0s kubectl apply -f /tmp/traefik-clusterrolebinding.yaml

echo "✅ Traefik RBAC created"

echo "📋 Creating Traefik deployment..."

# Create Traefik Deployment
cat > /tmp/traefik-deployment.yaml <<EOF
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
        image: traefik:v2.10
        args:
        - --api.dashboard=true
        - --api.insecure=true
        - --providers.kubernetes=true
        - --providers.kubernetes.ingressclass=traefik
        - --entrypoints.web.address=:80
        - --entrypoints.websecure.address=:443
        - --log.level=INFO
        ports:
        - name: web
          containerPort: 80
        - name: websecure
          containerPort: 443
        - name: admin
          containerPort: 8080
        resources:
          limits:
            memory: "128Mi"
            cpu: "100m"
          requests:
            memory: "64Mi"
            cpu: "50m"
        readinessProbe:
          httpGet:
            path: /ping
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /ping
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
EOF

docker exec infometis k0s kubectl apply -f /tmp/traefik-deployment.yaml

echo "✅ Traefik deployment created"

echo "📋 Creating Traefik service..."

# Create Traefik Service
cat > /tmp/traefik-service.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: traefik
  namespace: kube-system
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
  - name: admin
    port: 8080
    targetPort: 8080
  type: ClusterIP
EOF

docker exec infometis k0s kubectl apply -f /tmp/traefik-service.yaml

echo "✅ Traefik service created"

echo "📋 Creating IngressClass..."

# Create IngressClass
cat > /tmp/traefik-ingressclass.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF

docker exec infometis k0s kubectl apply -f /tmp/traefik-ingressclass.yaml

echo "✅ IngressClass created"

echo "📋 Checking Traefik pod status..."
docker exec infometis k0s kubectl get pods -n kube-system -l app=traefik

echo "📋 Waiting for Traefik to be ready..."
docker exec infometis k0s kubectl wait --for=condition=available --timeout=120s deployment/traefik -n kube-system || {
    echo "❌ Traefik deployment not ready within timeout"
    echo "📋 Pod details:"
    docker exec infometis k0s kubectl describe pods -n kube-system -l app=traefik
    echo "📋 Pod logs:"
    docker exec infometis k0s kubectl logs -n kube-system -l app=traefik --tail=50
    exit 1
}

echo "✅ Traefik is ready"

echo "📋 Verifying Traefik components..."
docker exec infometis k0s kubectl get deployment,service,ingressclass -n kube-system | grep traefik

# Clean up temporary files
rm -f /tmp/traefik-*.yaml

echo ""
echo "🎉 Traefik ingress controller deployed!"
echo "   Deployment: Ready"
echo "   Service: ClusterIP"
echo "   IngressClass: traefik"