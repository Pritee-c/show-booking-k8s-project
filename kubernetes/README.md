# Kubernetes Deployment Guide for GrabShow

## Overview

This directory contains all Kubernetes manifests needed to deploy the GrabShow microservices platform to a Kubernetes cluster.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐                                                │
│  │   Ingress    │  ← External access point                       │
│  └──────┬───────┘                                                │
│         │                                                         │
│         ├─→ user-service (4 replicas)    ────┐                  │
│         ├─→ event-service (4 replicas)    ───┤                  │
│         ├─→ booking-service (4 replicas)  ───┼─→ MySQL StatefulSet
│         └─→ cart-service (4 replicas)    ────┤                  │
│                                           ───┴─→ Redis (1 replica)
│                                                  │                │
└──────────────────────────────────────────────────┼────────────────┘
                                                   │
                                            PersistentVolume
```

## Files Included

| File | Purpose |
|------|---------|
| `configmap.yaml` | Non-sensitive configuration (DB URLs, Redis config) |
| `secret.yaml` | Sensitive data (passwords, credentials) |
| `mysql-statefulset.yaml` | MySQL database with persistent storage |
| `redis-deployment.yaml` | Redis cache layer |
| `user-service.yaml` | User microservice (4 replicas) |
| `event-service.yaml` | Event microservice (4 replicas) |
| `booking-service.yaml` | Booking microservice (4 replicas) |
| `cart-service.yaml` | Cart microservice (4 replicas) |
| `ingress.yaml` | API Gateway routing rules |
| `deploy.sh` | Automated deployment script |

## Prerequisites

- Kubernetes cluster (1.28+) with 2+ nodes
- `kubectl` configured to access your cluster
- Flannel or equivalent CNI installed
- Docker images pushed to registry:
  - `grabshow/user-service:latest`
  - `grabshow/event-service:latest`
  - `grabshow/booking-service:latest`
  - `grabshow/cart-service:latest`

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
cd kubernetes
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Create ConfigMap and Secret
2. Deploy MySQL StatefulSet
3. Deploy Redis
4. Deploy all 4 microservices
5. Deploy Ingress rules

### Option 2: Manual Deployment

```bash
# Create configuration
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# Deploy databases
kubectl apply -f mysql-statefulset.yaml
kubectl apply -f redis-deployment.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=mysql --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=60s

# Deploy microservices
kubectl apply -f user-service.yaml
kubectl apply -f event-service.yaml
kubectl apply -f booking-service.yaml
kubectl apply -f cart-service.yaml

# Deploy routing
kubectl apply -f ingress.yaml
```

## Monitoring Deployment

### Check Pod Status

```bash
# Watch all pods
kubectl get pods -w

# Watch specific service
kubectl get pods -l app=user-service -w
```

### View Logs

```bash
# Single pod
kubectl logs <pod-name>

# Follow logs
kubectl logs -l app=user-service -f

# Previous pod logs (if crashed)
kubectl logs <pod-name> --previous
```

### Check Service Status

```bash
# List all services
kubectl get svc

# Describe service
kubectl describe svc user-service

# Check endpoints
kubectl get endpoints
```

## Accessing Services

### From Within the Cluster

```bash
# Interactive pod for testing
kubectl run -it --rm test --image=alpine:latest --restart=Never -- sh

# Inside the pod, test services
wget -O- http://user-service:8001/actuator/health
wget -O- http://event-service:8002/api/events
wget -O- http://booking-service:8003/actuator/health
wget -O- http://cart-service:8004/actuator/health
```

### Port Forwarding (Access from Local Machine)

```bash
# Forward each service
kubectl port-forward svc/user-service 8001:8001 &
kubectl port-forward svc/event-service 8002:8002 &
kubectl port-forward svc/booking-service 8003:8003 &
kubectl port-forward svc/cart-service 8004:8004 &

# Now access from your machine
curl http://localhost:8001/actuator/health
curl http://localhost:8002/api/events
curl http://localhost:8003/actuator/health
curl http://localhost:8004/actuator/health

# Kill port forwarding
pkill -f "port-forward"
```

### Load Balancer / Ingress Access

If your cluster has an Ingress controller:

```bash
# Get Ingress IP/hostname
kubectl get ingress grabshow-ingress

# Access via ingress
curl http://<INGRESS_IP>/api/events
curl http://<INGRESS_IP>/api/users
curl http://<INGRESS_IP>/api/bookings
curl http://<INGRESS_IP>/api/cart
```

## Database Access

### MySQL Console

```bash
# Connect to MySQL pod
kubectl exec -it $(kubectl get pod -l app=mysql -o name) -- mysql -u root -p

# Inside MySQL:
SHOW DATABASES;
USE userdb;
SELECT * FROM users;
```

### Redis CLI

```bash
# Connect to Redis pod
kubectl exec -it $(kubectl get pod -l app=redis -o name) -- redis-cli

# Inside Redis:
PING
KEYS *
GET <key>
```

## Scaling Services

### Scale a Deployment

```bash
# Scale user-service to 6 replicas
kubectl scale deployment user-service --replicas=6

# Check
kubectl get pods -l app=user-service
```

### Auto-scaling (Requires Metrics Server)

```bash
# Install metrics-server first
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Enable HPA for user-service
kubectl autoscale deployment user-service --min=2 --max=10 --cpu-percent=80

# Check HPA status
kubectl get hpa
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### MySQL Connection Issues

```bash
# Check MySQL logs
kubectl logs -l app=mysql -f

# Test MySQL connectivity from pod
kubectl run -it --rm test --image=mysql:8.0 --restart=Never -- \
  mysql -h mysql-service -u bookmyshow -p

# Check MySQL service
kubectl describe svc mysql-service
```

### Redis Connection Issues

```bash
# Check Redis logs
kubectl logs -l app=redis -f

# Test Redis connectivity
kubectl run -it --rm test --image=redis:7-alpine --restart=Never -- \
  redis-cli -h redis-service ping
```

### Service Discovery Issues

```bash
# Test DNS resolution
kubectl run -it --rm test --image=alpine:latest --restart=Never -- sh
# Inside pod:
nslookup user-service
nslookup mysql-service
nslookup redis-service
```

## Updating Configuration

### Update Passwords (Recreate Secret)

```bash
# Delete old secret
kubectl delete secret grabshow-secret

# Edit secret.yaml with new values
# Then reapply
kubectl apply -f secret.yaml

# Restart pods to pick up new secret
kubectl rollout restart deployment user-service
kubectl rollout restart deployment event-service
kubectl rollout restart deployment booking-service
kubectl rollout restart deployment cart-service
```

### Update ConfigMap

```bash
# Edit configmap.yaml
# Then reapply
kubectl apply -f configmap.yaml

# Restart pods to pick up new config
kubectl rollout restart deployment user-service
# ... repeat for other services
```

## Production Considerations

### 1. Image Pull Secrets

If using private Docker registry:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password>

# Then add to pod spec:
spec:
  imagePullSecrets:
  - name: regcred
```

### 2. Resource Quotas

Limit namespace resource usage:

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: grabshow-quota
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
EOF
```

### 3. Network Policies

Restrict pod-to-pod communication:

```bash
# Only allow traffic to MySQL from microservices
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mysql-access
spec:
  podSelector:
    matchLabels:
      app: mysql
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - user-service
          - event-service
          - booking-service
          - cart-service
EOF
```

### 4. Pod Disruption Budgets

Ensure service availability during updates:

```bash
kubectl apply -f - <<EOF
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: grabshow-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      tier: microservice
EOF
```

## Cleanup

### Delete All Resources

```bash
# Delete everything created
kubectl delete deployment -l app in (user-service,event-service,booking-service,cart-service)
kubectl delete statefulset mysql
kubectl delete pvc mysql-pvc
kubectl delete configmap grabshow-config
kubectl delete secret grabshow-secret
kubectl delete svc -l app in (user-service,event-service,booking-service,cart-service)
kubectl delete ingress grabshow-ingress

# Or delete using files
kubectl delete -f configmap.yaml -f secret.yaml -f mysql-statefulset.yaml \
  -f redis-deployment.yaml -f user-service.yaml -f event-service.yaml \
  -f booking-service.yaml -f cart-service.yaml -f ingress.yaml
```

## Support & Debugging

### Useful Commands

```bash
# Get cluster info
kubectl cluster-info

# List all resources
kubectl get all

# Get detailed resource info
kubectl describe nodes
kubectl describe pod <pod-name>

# Check resource usage
kubectl top nodes
kubectl top pods

# View deployment history
kubectl rollout history deployment user-service

# Rollback deployment
kubectl rollout undo deployment user-service --to-revision=1
```

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Package Manager](https://helm.sh/)
- [Spring Boot on Kubernetes](https://spring.io/guides/tutorials/kubernetes/)
