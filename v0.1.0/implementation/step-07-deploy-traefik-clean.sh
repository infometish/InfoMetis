#!/bin/bash
# step-07-deploy-traefik-clean.sh
# Deploy Traefik ingress controller with volume mount approach

set -eu

echo "🌐 Step 7: Deploying Traefik Ingress Controller"
echo "==============================================="

echo "📋 Creating Traefik RBAC..."

# Create ServiceAccount
cat > traefik-sa.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik-ingress-controller
  namespace: kube-system
EOF

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-sa.yaml"

# Create ClusterRole
cat > traefik-clusterrole.yaml <<EOF
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

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-clusterrole.yaml"

# Create ClusterRoleBinding
cat > traefik-clusterrolebinding.yaml <<EOF
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

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-clusterrolebinding.yaml"

echo "✅ Traefik RBAC created"

echo "📋 Creating Traefik deployment..."

# Create Traefik Deployment
cat > traefik-deployment.yaml <<EOF
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
        - --providers.kubernetesingress=true
        - --providers.kubernetesingress.ingressendpoint.hostname=localhost
        - --ping
        ports:
        - name: web
          containerPort: 80
        - name: websecure
          containerPort: 443
        livenessProbe:
          httpGet:
            path: /ping
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ping
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
EOF

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-deployment.yaml"

echo "✅ Traefik deployment created"

echo "📋 Creating Traefik service..."

# Create Traefik Service
cat > traefik-service.yaml <<EOF
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
  type: ClusterIP
EOF

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-service.yaml"

echo "✅ Traefik service created"

echo "📋 Creating IngressClass..."

# Create IngressClass
cat > traefik-ingressclass.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-ingressclass.yaml"

echo "✅ IngressClass created"

echo "📋 Checking Traefik pod status..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get pods -n kube-system -l app=traefik"

echo "📋 Waiting for Traefik to be ready..."
docker exec infometis sh -c "cd /workspace && k0s kubectl wait --for=condition=available --timeout=120s deployment/traefik -n kube-system" || {
    echo "❌ Traefik deployment not ready within timeout"
    echo "📋 Pod details:"
    docker exec infometis sh -c "cd /workspace && k0s kubectl describe pods -n kube-system -l app=traefik"
    echo "📋 Pod logs:"
    docker exec infometis sh -c "cd /workspace && k0s kubectl logs -n kube-system -l app=traefik --tail=50"
    exit 1
}

echo "✅ Traefik is ready"

echo "📋 Verifying Traefik components..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get deployment,service,ingressclass -n kube-system | grep traefik"

# Clean up temporary files
rm -f traefik-*.yaml

echo ""
echo "🎉 Traefik ingress controller deployed!"
echo "   Deployment: Ready"
echo "   Service: ClusterIP"
echo "   IngressClass: traefik"
echo "   Note: Admin dashboard disabled to avoid port conflicts"