#!/bin/bash
# InfoMetis v0.5.0 - Prometheus Deployment Test Script
# Quick verification that Prometheus components are working

echo "=== InfoMetis Prometheus Deployment Test ==="
echo

echo "1. Checking Prometheus deployment status..."
kubectl get deployment prometheus-server -n infometis
echo

echo "2. Checking Alertmanager deployment status..."
kubectl get deployment alertmanager -n infometis
echo

echo "3. Checking Node Exporter daemon set status..."
kubectl get daemonset node-exporter -n infometis
echo

echo "4. Checking services..."
kubectl get services -n infometis | grep -E "(prometheus|alertmanager|node-exporter)"
echo

echo "5. Checking ingress..."
kubectl get ingress -n infometis | grep -E "(prometheus|alertmanager)"
echo

echo "6. Testing Prometheus endpoint (via port-forward)..."
echo "To test Prometheus UI, run:"
echo "kubectl port-forward -n infometis service/prometheus-server-service 9090:9090"
echo "Then visit: http://localhost:9090"
echo

echo "7. Testing Alertmanager endpoint (via port-forward)..."
echo "To test Alertmanager UI, run:"
echo "kubectl port-forward -n infometis service/alertmanager-service 9093:9093"
echo "Then visit: http://localhost:9093"
echo

echo "8. Testing via Traefik ingress..."
echo "Visit: http://localhost/prometheus"
echo "Visit: http://localhost/alertmanager"
echo

echo "=== Prometheus Test Complete ==="