#!/bin/bash
# step-07-deploy-traefik-fixed.sh
# Deploy Traefik creating files inside container

set -eu

echo "🌐 Step 7: Deploying Traefik Ingress Controller"
echo "==============================================="

echo "📋 Creating Traefik ServiceAccount..."
docker exec infometis sh -c "cd /workspace && cat > traefik-sa.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik-ingress-controller
  namespace: kube-system
EOF"

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-sa.yaml"

echo "📋 Creating Traefik ClusterRole..."
docker exec infometis sh -c "cd /workspace && cat > traefik-clusterrole.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: traefik-ingress-controller
rules:
- apiGroups: [\"\"]
  resources: [\"services\", \"endpoints\", \"secrets\"]
  verbs: [\"get\", \"list\", \"watch\"]
- apiGroups: [\"extensions\", \"networking.k8s.io\"]
  resources: [\"ingresses\", \"ingressclasses\"]
  verbs: [\"get\", \"list\", \"watch\"]
- apiGroups: [\"extensions\"]
  resources: [\"ingresses/status\"]
  verbs: [\"update\"]
EOF"

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-clusterrole.yaml"

echo "📋 Creating Traefik ClusterRoleBinding..."
docker exec infometis sh -c "cd /workspace && cat > traefik-clusterrolebinding.yaml <<EOF
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
EOF"

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-clusterrolebinding.yaml"

echo "📋 Creating Traefik Deployment..."
docker exec infometis sh -c "cd /workspace && cat > traefik-deployment.yaml <<EOF
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
        - --log.level=INFO
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
EOF"

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-deployment.yaml"

echo "📋 Creating Traefik Service..."
docker exec infometis sh -c "cd /workspace && cat > traefik-service.yaml <<EOF
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
    nodePort: 30080
  - name: websecure
    port: 443
    targetPort: 443
    nodePort: 30443
  type: NodePort
EOF"

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-service.yaml"

echo "📋 Creating IngressClass..."
docker exec infometis sh -c "cd /workspace && cat > traefik-ingressclass.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF"

docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f traefik-ingressclass.yaml"

echo "📋 Waiting for Traefik to be ready..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get pods -n kube-system -l app=traefik"

echo "📋 Waiting for deployment to be available..."
docker exec infometis sh -c "cd /workspace && k0s kubectl wait --for=condition=available --timeout=120s deployment/traefik -n kube-system" || {
    echo "⚠️  Deployment not ready within timeout. Checking status..."
    docker exec infometis sh -c "cd /workspace && k0s kubectl describe pods -n kube-system -l app=traefik"
    docker exec infometis sh -c "cd /workspace && k0s kubectl logs -n kube-system -l app=traefik --tail=50"
}

echo "📋 Verifying Traefik deployment..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get deployment,service,ingressclass -n kube-system | grep traefik"

# Clean up temporary files
docker exec infometis sh -c "cd /workspace && rm -f traefik-*.yaml"

echo ""
echo "🎉 Traefik deployment complete!"
echo "   Ingress controller: Ready for routing"  
echo "   Web traffic: http://localhost:30080"
echo "   HTTPS traffic: https://localhost:30443"