#!/bin/bash

# GrabShow Kubernetes Troubleshooting Script
# Use this to diagnose deployment issues

echo "=================================================="
echo "GrabShow Kubernetes Troubleshooting"
echo "=================================================="

echo ""
echo "=== CLUSTER STATUS ==="
kubectl get nodes
kubectl get events --sort-by='.lastTimestamp' | tail -20

echo ""
echo "=== MYSQL STATUS ==="
kubectl get statefulset mysql
kubectl get pods -l app=mysql -o wide
kubectl describe pod -l app=mysql

echo ""
echo "=== MYSQL LOGS ==="
echo "Last 50 lines of MySQL pod logs:"
kubectl logs -l app=mysql --tail=50

echo ""
echo "=== PVC STATUS ==="
kubectl get pvc

echo ""
echo "=== REDIS STATUS ==="
kubectl get pods -l app=redis -o wide
kubectl describe pod -l app=redis

echo ""
echo "=== ALL PODS STATUS ==="
kubectl get pods -o wide

echo ""
echo "=== DISK SPACE ==="
echo "Checking node disk space..."
kubectl describe nodes | grep -A5 "Allocated resources"

echo ""
echo "=== DISK USAGE BY POD ==="
kubectl top pods 2>/dev/null || echo "Metrics server not installed. Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"

echo ""
echo "=== SERVICES ==="
kubectl get svc

echo ""
echo "=== CONFIGMAP & SECRET ==="
kubectl get configmap grabshow-config -o yaml
echo "---"
echo "Secret exists: $(kubectl get secret grabshow-secret -o name 2>/dev/null || echo 'NOT FOUND')"

echo ""
echo "=================================================="
echo "NEXT STEPS:"
echo "=================================================="
echo ""
echo "1. Check MySQL logs above for specific error"
echo "2. If 'CrashLoopBackOff', check logs for MySQL startup errors"
echo "3. If 'Pending', check:"
echo "   kubectl describe pvc mysql-pvc"
echo "4. If storage issue, try:"
echo "   kubectl delete pvc mysql-pvc"
echo "   kubectl apply -f mysql-statefulset.yaml"
echo "5. To delete and restart MySQL:"
echo "   kubectl delete statefulset mysql"
echo "   kubectl delete pvc mysql-pvc"
echo "   kubectl apply -f mysql-statefulset.yaml"
echo ""
