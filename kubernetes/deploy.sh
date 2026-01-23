#!/bin/bash

# GrabShow Kubernetes Deployment Script
# This script deploys all GrabShow microservices to Kubernetes

set -e

echo "=================================================="
echo "GrabShow Kubernetes Deployment"
echo "=================================================="

# Step 1: Create ConfigMap and Secrets
echo ""
echo "[1/6] Creating ConfigMap and Secrets..."
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
sleep 2

# Step 2: Deploy MySQL
echo ""
echo "[2/6] Deploying MySQL StatefulSet..."
kubectl apply -f mysql-statefulset.yaml
echo "Waiting for MySQL to be ready (this may take 1-2 minutes)..."
kubectl wait --for=condition=ready pod -l app=mysql --timeout=300s 2>/dev/null || {
  echo "MySQL taking longer than expected. Checking logs..."
  kubectl logs -l app=mysql --tail=20
  echo "Retrying wait..."
  kubectl wait --for=condition=ready pod -l app=mysql --timeout=120s
}
sleep 5

# Step 3: Deploy Redis
echo ""
echo "[3/6] Deploying Redis..."
kubectl apply -f redis-deployment.yaml
echo "Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis --timeout=60s
sleep 3

# Step 4: Deploy Microservices
echo ""
echo "[4/6] Deploying User Service..."
kubectl apply -f user-service.yaml
echo "Waiting for User Service to be ready..."
kubectl wait --for=condition=ready pod -l app=user-service --timeout=120s 2>/dev/null || echo "Warning: User Service taking longer than expected"

echo ""
echo "[5/6] Deploying Event, Booking, and Cart Services..."
kubectl apply -f event-service.yaml
kubectl apply -f booking-service.yaml
kubectl apply -f cart-service.yaml

echo "Waiting for Event Service to be ready..."
kubectl wait --for=condition=ready pod -l app=event-service --timeout=120s 2>/dev/null || echo "Warning: Event Service taking longer than expected"

echo "Waiting for Booking Service to be ready..."
kubectl wait --for=condition=ready pod -l app=booking-service --timeout=120s 2>/dev/null || echo "Warning: Booking Service taking longer than expected"

echo "Waiting for Cart Service to be ready..."
kubectl wait --for=condition=ready pod -l app=cart-service --timeout=120s 2>/dev/null || echo "Warning: Cart Service taking longer than expected"

sleep 5

# Step 5: Deploy Ingress
echo ""
echo "[6/6] Deploying Ingress..."
kubectl apply -f ingress.yaml

echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Checking deployment status..."
echo ""

kubectl get nodes
echo ""
kubectl get pods -o wide
echo ""
kubectl get svc
echo ""

echo "To check if services are ready:"
echo "  kubectl get pods -w"
echo ""
echo "To view service logs:"
echo "  kubectl logs -l app=user-service -f"
echo "  kubectl logs -l app=event-service -f"
echo "  kubectl logs -l app=booking-service -f"
echo "  kubectl logs -l app=cart-service -f"
echo ""
echo "To test the APIs:"
echo "  kubectl run -it --rm test --image=alpine:latest --restart=Never -- sh"
echo "  # Inside the pod:"
echo "  wget -O- http://user-service:8001/actuator/health"
echo "  wget -O- http://event-service:8002/api/events"
echo "  wget -O- http://booking-service:8003/actuator/health"
echo "  wget -O- http://cart-service:8004/actuator/health"
echo ""
echo "To port-forward and access from your machine:"
echo "  kubectl port-forward svc/user-service 8001:8001 &"
echo "  kubectl port-forward svc/event-service 8002:8002 &"
echo "  kubectl port-forward svc/booking-service 8003:8003 &"
echo "  kubectl port-forward svc/cart-service 8004:8004 &"
echo ""
