#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Traefik Deployment Component
# Component script: Traefik ingress controller deployment

echo "🌐 InfoMetis v0.2.0 - Traefik Deployment Component"
echo "================================================="
echo "Component: Traefik ingress controller with InfoMetis configuration"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Function: Load Traefik image
load_traefik_image() {
    echo "📦 Loading Traefik image..."
    
    if [[ -f "${CACHE_DIR}/traefik-latest.tar" ]]; then
        docker load -i "${CACHE_DIR}/traefik-latest.tar" >/dev/null 2>&1
        echo "✅ Traefik image loaded from cache"
    else
        echo "⚠️  Traefik image not cached, will pull from registry"
        docker pull traefik:latest
        echo "✅ Traefik image pulled"
    fi
}

# Function: Create Traefik RBAC
create_traefik_rbac() {
    echo "🔐 Creating Traefik RBAC..."
    
    # ServiceAccount
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik
  namespace: kube-system
EOF

    # ClusterRole
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: traefik
rules:
- apiGroups: [""]
  resources: ["services","endpoints","secrets"]
  verbs: ["get","list","watch"]
- apiGroups: ["extensions","networking.k8s.io"]
  resources: ["ingresses","ingressclasses"]
  verbs: ["get","list","watch"]
- apiGroups: ["extensions","networking.k8s.io"]
  resources: ["ingresses/status"]
  verbs: ["update"]
EOF

    # ClusterRoleBinding
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: traefik
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: traefik
subjects:
- kind: ServiceAccount
  name: traefik
  namespace: kube-system
EOF

    echo "✅ Traefik RBAC created"
}

# Function: Create IngressClass
create_ingress_class() {
    echo "📋 Creating Traefik IngressClass..."
    
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF

    echo "✅ IngressClass created"
}

# Function: Deploy Traefik
deploy_traefik() {
    echo "🚀 Deploying Traefik..."
    
    kubectl apply -f - <<EOF
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
      serviceAccountName: traefik
      containers:
      - name: traefik
        image: traefik:latest
        args:
        - --api.insecure=true
        - --providers.kubernetesingress=true
        - --providers.kubernetesingress.ingressclass=traefik
        - --entrypoints.web.address=:80
        - --entrypoints.websecure.address=:443
        - --log.level=INFO
        - --accesslog=true
        ports:
        - name: web
          containerPort: 80
          hostPort: 80
        - name: websecure
          containerPort: 443
          hostPort: 443
        - name: admin
          containerPort: 8080
          hostPort: 8080
      hostNetwork: true
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule
EOF

    echo "✅ Traefik deployment created"
}

# Function: Create Traefik Service
create_traefik_service() {
    echo "🔗 Creating Traefik Service..."
    
    kubectl apply -f - <<EOF
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

    echo "✅ Traefik service created"
}

# Function: Wait for Traefik
wait_for_traefik() {
    echo "⏳ Waiting for Traefik to be ready..."
    
    kubectl wait --for=condition=available deployment/traefik -n kube-system --timeout=300s
    
    # Additional check for Traefik dashboard
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8080/api/rawdata >/dev/null 2>&1; then
            echo "✅ Traefik dashboard is accessible"
            return 0
        fi
        
        echo "  Attempt $((attempt + 1))/$max_attempts - waiting for dashboard..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  Traefik deployed but dashboard may not be ready"
    return 0
}

# Function: Verify Traefik
verify_traefik() {
    echo "🔍 Verifying Traefik deployment..."
    
    if kubectl get deployment traefik -n kube-system >/dev/null 2>&1; then
        echo "✅ Traefik deployment exists"
        
        if kubectl get pods -n kube-system -l app=traefik | grep -q Running; then
            echo "✅ Traefik pod is running"
            
            if curl -f http://localhost:8080/api/rawdata >/dev/null 2>&1; then
                echo "✅ Traefik dashboard is accessible"
                return 0
            else
                echo "⚠️  Traefik dashboard not accessible"
                return 1
            fi
        else
            echo "❌ Traefik pod not running"
            return 1
        fi
    else
        echo "❌ Traefik deployment not found"
        return 1
    fi
}

# Function: Get Traefik status
get_traefik_status() {
    echo "📊 Traefik Status:"
    echo "=================="
    
    kubectl get deployment traefik -n kube-system
    echo ""
    kubectl get pods -n kube-system -l app=traefik
    echo ""
    kubectl get service traefik -n kube-system
    echo ""
    
    if curl -f http://localhost:8080/api/rawdata >/dev/null 2>&1; then
        echo "🌐 Dashboard: http://localhost:8080 (accessible)"
    else
        echo "🌐 Dashboard: http://localhost:8080 (not accessible)"
    fi
}

# Main execution
main() {
    local operation="${1:-deploy}"
    
    case "$operation" in
        "deploy")
            load_traefik_image
            create_traefik_rbac
            create_ingress_class
            deploy_traefik
            create_traefik_service
            wait_for_traefik
            verify_traefik
            ;;
        "verify")
            verify_traefik
            ;;
        "status")
            get_traefik_status
            ;;
        "rbac")
            create_traefik_rbac
            create_ingress_class
            ;;
        *)
            echo "Usage: $0 [deploy|verify|status|rbac]"
            echo ""
            echo "Operations:"
            echo "  deploy    - Complete Traefik deployment (default)"
            echo "  verify    - Verify Traefik is working"
            echo "  status    - Show Traefik status"
            echo "  rbac      - Create RBAC and IngressClass only"
            exit 1
            ;;
    esac
}

# Export functions for use by other scripts
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi