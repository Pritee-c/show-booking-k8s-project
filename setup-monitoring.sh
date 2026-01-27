#!/bin/bash

# Quick Setup Script for Prometheus & Grafana on Kubernetes

set -e

echo "=========================================="
echo "Installing Prometheus & Grafana Stack"
echo "=========================================="

# Step 1: Add Helm repositories
echo ""
echo "[1/6] Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
echo "✅ Helm repos added"

# Step 2: Create monitoring namespace
echo ""
echo "[2/6] Creating monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Namespace created"

# Step 3: Install Prometheus Stack
echo ""
echo "[3/6] Installing Prometheus Stack (this may take 2-3 minutes)..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123 \
  --wait
echo "✅ Prometheus Stack installed"

# Step 4: Create NodePort services
echo ""
echo "[4/6] Creating NodePort services..."
kubectl apply -f kubernetes/monitoring-nodeport.yaml
echo "✅ NodePort services created"

# Step 5: Create ServiceMonitors for microservices
echo ""
echo "[5/6] Creating ServiceMonitors..."
kubectl apply -f kubernetes/servicemonitor.yaml
echo "✅ ServiceMonitors created"

# Step 6: Create alert rules
echo ""
echo "[6/6] Creating Prometheus alert rules..."
kubectl apply -f kubernetes/prometheus-rules.yaml
echo "✅ Alert rules created"

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Access URLs:"
echo "  Prometheus:   http://<node-ip>:30090"
echo "  Grafana:      http://<node-ip>:30300  (admin/admin123)"
echo "  AlertManager: http://<node-ip>:30093"
echo ""
echo "Check pod status:"
echo "  kubectl get pods -n monitoring"
echo ""
echo "Check ServiceMonitors:"
echo "  kubectl get servicemonitor"
echo ""
echo "View Prometheus targets:"
echo "  kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 --address 0.0.0.0 &"
echo "  Then visit: http://localhost:9090/targets"
echo ""
