# GrabShow - Ticket Booking Microservices Platform

A scalable ticket booking system built with Spring Boot microservices architecture, containerized with Docker, and deployable on AWS EC2.

## 🏗️ Architecture

```
┌─────────────┐
│   Nginx     │  ← API Gateway (Port 80)
│  (Gateway)  │
└──────┬──────┘
       │
       ├─────→ User Service (8001)      ─┐
       ├─────→ Event Service (8002)     ─┼─→ MySQL (3306)
       ├─────→ Booking Service (8003)   ─┤
       └─────→ Cart Service (8004)      ─┴─→ Redis (6379)
```

## 🚀 Tech Stack

- **Backend**: Spring Boot 3.2.2, Java 17
- **Database**: MySQL 8.0 (separate DB per service)
- **Cache**: Redis 7 (for cart service)
- **Gateway**: Nginx 1.24
- **Container**: Docker, Docker Compose
- **Orchestration**: Kubernetes 1.28+
- **Monitoring**: Prometheus, Grafana, AlertManager
- **Metrics**: Micrometer, Spring Boot Actuator
- **CI/CD**: Jenkins 2.479.3
- **Cloud**: AWS EC2 (Ubuntu 22.04)

## 📦 Microservices

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| **user-service** | 8001 | userdb | User registration & authentication |
| **event-service** | 8002 | eventdb | Event/show management with auto-seeding |
| **booking-service** | 8003 | bookingdb | Ticket booking management |
| **cart-service** | 8004 | cartdb + Redis | Shopping cart with caching |

## 🔧 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git
- AWS EC2 instance (t3.medium recommended)

## 🛠️ Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/Pritee-c/show-booking-k8s-project.git
cd show-booking-k8s-project
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your passwords
nano .env
```

**Required environment variables:**

```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_USER=bookmyshow
MYSQL_PASSWORD=your_password

DATABASE_URL_USER=jdbc:mysql://mysql:3306/userdb?createDatabaseIfNotExist=true
DATABASE_URL_EVENT=jdbc:mysql://mysql:3306/eventdb?createDatabaseIfNotExist=true
DATABASE_URL_BOOKING=jdbc:mysql://mysql:3306/bookingdb?createDatabaseIfNotExist=true
DATABASE_URL_CART=jdbc:mysql://mysql:3306/cartdb?createDatabaseIfNotExist=true

JPA_DDL_AUTO=update

REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Build and Run

```bash
# Build all Docker images
docker-compose build --no-cache

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f user-service
```

### 4. Verify Deployment

```bash
# Frontend
curl -I http://localhost/

# Events API (should return 6 seeded events)
curl http://localhost/api/events

# Health checks
curl http://localhost:8001/actuator/health
curl http://localhost:8002/actuator/health
curl http://localhost:8003/actuator/health
curl http://localhost:8004/actuator/health
```

## 🌐 API Endpoints

### User Service (`/api/users`)

```bash
# Register user
POST /api/users/register
Content-Type: application/json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123"
}

# Get user by username
GET /api/users/{username}
```

### Event Service (`/api/events`)

```bash
# Get all events
GET /api/events

# Get event by ID
GET /api/events/{id}

# Create event
POST /api/events
Content-Type: application/json
{
  "title": "Concert Night",
  "description": "Live music event",
  "type": "CONCERT",
  "venue": "City Arena",
  "eventDateTime": "2026-02-15T19:00:00",
  "totalSeats": 500,
  "price": 45.00
}
```

### Booking Service (`/api/bookings`)

```bash
# Create booking
POST /api/bookings
Content-Type: application/json
{
  "userId": 1,
  "eventId": 2,
  "numberOfSeats": 2
}

# Get user bookings
GET /api/bookings/user/{userId}

# Get booking by ID
GET /api/bookings/{id}

# Update booking status
PATCH /api/bookings/{id}/status?status=CONFIRMED
```

### Cart Service (`/api/cart`)

```bash
# Add item to cart
POST /api/cart
Content-Type: application/json
{
  "userId": 1,
  "eventId": 3,
  "quantity": 2,
  "price": 14.99
}

# Get user cart
GET /api/cart/user/{userId}

# Remove item from cart
DELETE /api/cart/user/{userId}/item/{itemId}

# Clear cart
DELETE /api/cart/user/{userId}
```

## 🔒 Security Features

- **Environment Variables**: All secrets in `.env` (not committed to git)
- **No Hardcoded Passwords**: Services fail if env vars missing
- **Git Ignore**: `.env` excluded via `.gitignore`
- **Multi-stage Docker Builds**: Minimal attack surface (JRE only, no build tools)

## 🐳 Docker Commands

```bash
# Build specific service
docker-compose build user-service

# Restart service
docker-compose restart event-service

# View logs
docker-compose logs -f cart-service

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v

# Scale service (if stateless)
docker-compose up -d --scale booking-service=3
```

## 📊 Monitoring

### Docker Environment

```bash
# Check container stats
docker stats

# Inspect service
docker inspect user-service

# Access MySQL
docker exec -it grabshow-mysql mysql -ubookmyshow -p

# Access Redis
docker exec -it grabshow-redis redis-cli
```

### Kubernetes Monitoring Stack

The project includes a comprehensive monitoring solution with **Prometheus**, **Grafana**, and **AlertManager**.

#### Quick Setup

```bash
# Automated installation
chmod +x setup-monitoring.sh
./setup-monitoring.sh
```

#### Access Monitoring Tools

```bash
# Get your node IP
kubectl get nodes -o wide

# Access via NodePort
Prometheus:   http://<node-ip>:30090
Grafana:      http://<node-ip>:30300  (admin/admin123)
AlertManager: http://<node-ip>:30093
```

#### Key Features

- **Metrics Collection**: Automatic scraping from all microservices every 30 seconds
- **Service Discovery**: ServiceMonitors auto-discover new pods
- **Pre-configured Alerts**: High error rate, slow response, memory pressure, pod crashes
- **Real-time Dashboards**: JVM metrics, HTTP requests, latency, resource usage
- **Alert Routing**: AlertManager for notification management

#### Import Grafana Dashboards

1. Login to Grafana (admin/admin123)
2. Import these dashboard IDs:
   - **1860**: Node Exporter (infrastructure)
   - **15759**: Kubernetes Cluster Overview
   - **11378**: JVM Micrometer (Spring Boot apps)

#### View Metrics

```bash
# Check Prometheus targets
http://<node-ip>:30090/targets

# Example PromQL queries
# Request rate: sum(rate(http_server_requests_seconds_count[5m])) by (job)
# Error rate: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
# JVM memory: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}
```

For detailed monitoring documentation, see [monitoring_manual.md](monitoring_manual.md).

## 🧪 Testing

```bash
# Test event seeding (should return 6 events)
curl http://localhost/api/events | jq

# Register test user
curl -X POST http://localhost/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"test123"}'

# Create booking
curl -X POST http://localhost/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"eventId":1,"numberOfSeats":2}'

# Add to cart
curl -X POST http://localhost/api/cart \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"eventId":2,"quantity":1,"price":39.50}'
```

## 📝 Sample Seeded Events

The event-service automatically seeds 6 sample events on startup:

1. **Neon Nights** (Movie) - Downtown IMAX - $14.99
2. **Skyline Sessions** (Concert) - Harbor Arena - $39.50
3. **Clockwork Sonata** (Theater) - Grand Royale - $49.00
4. **City Derby Finals** (Sports) - Riverfront Stadium - $59.00
5. **Laugh Lab Live** (Comedy) - Brickhouse Club - $24.00
6. **FutureTech Expo** (Expo) - Innovation Center - $19.00

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs user-service

# Verify env vars loaded
docker inspect user-service | grep SPRING_DATASOURCE

# Check MySQL connectivity
docker exec grabshow-mysql mysql -ubookmyshow -p -e "SHOW DATABASES;"
```

### Port conflicts

```bash
# Check ports in use
sudo netstat -tlnp | grep -E '80|3306|6379|8001|8002|8003|8004'

# Kill process using port
sudo kill -9 <PID>
```

### MySQL access denied

```bash
# Recreate MySQL with fresh credentials
docker-compose down
docker volume rm bookmyshow_mysql_data
docker-compose up -d mysql
```

## 📁 Project Structure

```
.
├── user-service/          # User management microservice
├── event-service/         # Event management with auto-seeding
├── booking-service/       # Booking management
├── cart-service/          # Cart with Redis caching
├── nginx/                 # API gateway configuration
│   └── bookmyshow.conf
├── frontend/              # Static HTML/CSS/JS files
├── kubernetes/            # Kubernetes manifests
│   ├── configmap.yaml     # Non-sensitive configuration
│   ├── secret.yaml.example # Secret template
│   ├── mysql-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── *-service.yaml     # Microservice deployments
│   ├── servicemonitor.yaml # Prometheus scraping config
│   ├── prometheus-rules.yaml # Alert definitions
│   ├── monitoring-nodeport.yaml # Monitoring access
│   └── README.md          # Kubernetes documentation
├── docker-compose.yml     # Multi-container orchestration
├── setup-monitoring.sh    # Automated monitoring setup
├── monitoring_manual.md   # Comprehensive monitoring guide
├── ARCHITECTURE.md        # System architecture documentation
├── .env                   # Environment variables (not in git)
├── .env.example           # Template for environment variables
├── .gitignore            # Git exclusions
└── README.md             # This file
```

## ☸️ Kubernetes Deployment

### Quick Start

```bash
# Navigate to kubernetes directory
cd kubernetes

# Deploy using automated script
chmod +x deploy.sh
./deploy.sh

# Or deploy manually
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f mysql-statefulset.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f user-service.yaml
kubectl apply -f event-service.yaml
kubectl apply -f booking-service.yaml
kubectl apply -f cart-service.yaml
kubectl apply -f ingress.yaml
```

### Verify Deployment

```bash
# Watch pods come up
kubectl get pods -w

# Check services
kubectl get svc

# Test service discovery
kubectl run -it --rm test --image=alpine:latest --restart=Never -- sh
# Inside pod:
wget -O- http://user-service:8001/actuator/health
wget -O- http://event-service:8002/api/events
```

### Port Forwarding for Local Testing

```bash
# Forward services to localhost
kubectl port-forward svc/user-service 8001:8001 &
kubectl port-forward svc/event-service 8002:8002 &
kubectl port-forward svc/booking-service 8003:8003 &
kubectl port-forward svc/cart-service 8004:8004 &

# Test APIs
curl http://localhost:8002/api/events
```

### Key Features

- **ConfigMap**: Non-sensitive configuration (DB URLs, Redis host)
- **Secrets**: Sensitive data (MySQL passwords)
- **StatefulSet**: MySQL with persistent storage
- **Deployments**: 4 microservices with 2 replicas each (scalable)
- **Services**: ClusterIP for internal service discovery
- **Ingress**: API routing and load balancing
- **Pod Anti-Affinity**: Spread replicas across nodes for high availability
- **Health Checks**: Startup, liveness & readiness probes on all services
- **Monitoring**: Prometheus + Grafana stack with ServiceMonitors
- **Alerting**: Pre-configured alerts for errors, latency, resource usage
- **NodePort Services**: External access to microservices and monitoring tools

### Monitoring Stack

```bash
# Quick setup
./setup-monitoring.sh

# Access
Prometheus:   http://<node-ip>:30090
Grafana:      http://<node-ip>:30300  (admin/admin123)
AlertManager: http://<node-ip>:30093
```

**What's monitored:**
- HTTP request rates, latency, error rates
- JVM memory, GC activity, thread count
- Database connection pool stats
- Redis connection and memory usage
- Pod restarts, resource usage
- Node health and resource pressure

See [kubernetes/README.md](kubernetes/README.md) for detailed Kubernetes documentation.
See [monitoring_manual.md](monitoring_manual.md) for comprehensive monitoring guide.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request


## 🔗 Links

### Docker Deployment
- **Frontend**: http://localhost/
- **API Gateway**: http://localhost/api/
- **Jenkins**: http://localhost:8080/
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

### Kubernetes Deployment
- **Microservices**: http://\<node-ip\>:30001-30004
- **Prometheus**: http://\<node-ip\>:30090
- **Grafana**: http://\<node-ip\>:30300 (admin/admin123)
- **AlertManager**: http://\<node-ip\>:30093

### Documentation
- **Kubernetes Guide**: [kubernetes/README.md](kubernetes/README.md)
- **Monitoring Manual**: [monitoring_manual.md](monitoring_manual.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Built with ❤️ using Spring Boot, Docker, Kubernetes, and Microservices Architecture**
