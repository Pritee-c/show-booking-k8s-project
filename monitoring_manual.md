# Monitoring Implementation Manual

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Components & Their Purpose](#components--their-purpose)
3. [Data Flow Explanation](#data-flow-explanation)
4. [Files & Configuration](#files--configuration)
5. [What Gets Monitored](#what-gets-monitored)
6. [Quick Command Reference](#quick-command-reference)

---

## Architecture Overview

The monitoring stack uses **Prometheus** (metrics collection), **Grafana** (visualization), and **AlertManager** (alerting) on Kubernetes.

### Flow Diagram
```
Spring Boot Apps → Metrics Endpoint → ServiceMonitor → Prometheus → Grafana
                                                            ↓
                                                      AlertManager
```

### High-Level Components
- **Spring Boot Actuator**: Exposes metrics from Java applications
- **Micrometer**: Converts metrics to Prometheus format
- **ServiceMonitor**: Custom resource that tells Prometheus what to scrape
- **Prometheus**: Collects, stores, and queries time-series metrics
- **Grafana**: Creates dashboards and visualizations
- **AlertManager**: Routes and manages alerts

---

## Components & Their Purpose

### 1. Prometheus
**Role**: Metrics collection and storage engine

**What it does**:
- Scrapes metrics from targets (every 30 seconds by default)
- Stores time-series data in internal TSDB
- Evaluates alert rules
- Provides PromQL query language
- Service discovery via Kubernetes API

**Default retention**: 15 days

### 2. Grafana
**Role**: Visualization and dashboards

**What it does**:
- Queries Prometheus using PromQL
- Creates real-time dashboards
- Supports graphs, gauges, tables, heatmaps
- User management and sharing
- Alert visualization

**Default credentials**: admin / admin123

### 3. AlertManager
**Role**: Alert routing and management

**What it does**:
- Receives alerts from Prometheus
- Deduplicates identical alerts
- Groups related alerts
- Routes to receivers (email, Slack, PagerDuty)
- Silencing and inhibition rules

### 4. ServiceMonitor (CRD)
**Role**: Automatic service discovery

**What it does**:
- Kubernetes Custom Resource Definition
- Tells Prometheus which services to scrape
- Defines scrape interval, path, timeout
- Uses label selectors to find pods
- Managed by Prometheus Operator

### 5. PrometheusRule (CRD)
**Role**: Alert definitions

**What it does**:
- Defines alert conditions using PromQL
- Sets severity levels (critical, warning, info)
- Specifies evaluation intervals
- Includes annotations for alert context

### 6. Spring Boot Actuator
**Role**: Application metrics exposure

**What it does**:
- Exposes `/actuator/prometheus` endpoint
- Provides health checks, metrics, info
- Integrates with Micrometer
- Zero-config defaults with customization options

---

## Data Flow Explanation

### Step 1: Metrics Generation (Application Level)
**Where**: Inside Spring Boot microservices (user-service, cart-service, etc.)

**What happens**:
- Micrometer instruments your code automatically
- Captures metrics:
  - HTTP requests: count, duration, status codes
  - JVM: heap/non-heap memory, GC activity, threads
  - Database: HikariCP connection pool stats
  - Redis: connection stats
  - Custom business metrics (if added)

**Example auto-captured metrics**:
```
http_server_requests_seconds_count{method="GET",uri="/api/users",status="200"} 1234
jvm_memory_used_bytes{area="heap",id="PS Eden Space"} 536870912
hikaricp_connections_active{pool="HikariPool-1"} 5
```

### Step 2: Metrics Exposure (Endpoint)
**Where**: Actuator endpoint in each pod

**URL**: `http://<pod-ip>:8004/actuator/prometheus`

**Format**: Prometheus text-based exposition format
```
# HELP http_server_requests_seconds Duration of HTTP server request handling
# TYPE http_server_requests_seconds summary
http_server_requests_seconds_count{method="GET",uri="/api/cart",status="200"} 142
http_server_requests_seconds_sum{method="GET",uri="/api/cart",status="200"} 12.5
```

### Step 3: Service Discovery (ServiceMonitor)
**Where**: Kubernetes API + Prometheus Operator

**What happens**:
1. You create ServiceMonitor YAML (e.g., `cart-service-monitor`)
2. Prometheus Operator watches for new ServiceMonitors
3. Operator queries Kubernetes API for services matching selector:
   ```yaml
   selector:
     matchLabels:
       app: cart-service
   ```
4. Finds all pods behind that service
5. Generates Prometheus scrape configuration automatically
6. Updates Prometheus config without restart

**Result**: Prometheus knows to scrape `10.244.1.68:8004/actuator/prometheus` and `10.244.1.69:8004/actuator/prometheus` (both cart-service pods)

### Step 4: Metrics Collection (Scraping)
**Where**: Prometheus server

**What happens**:
1. Every 30 seconds (defined in ServiceMonitor):
   ```yaml
   interval: 30s
   scrapeTimeout: 10s
   ```
2. Prometheus makes HTTP GET to each target's `/actuator/prometheus`
3. Parses text format into time-series data
4. Adds labels:
   - `job`: service name (e.g., `cart-service`)
   - `instance`: pod IP + port
   - `namespace`: Kubernetes namespace
   - `pod`: pod name
5. Stores in local TSDB with timestamp

**Storage format**:
```
metric_name{label1="value1", label2="value2"} value timestamp
```

### Step 5: Data Storage (TSDB)
**Where**: Prometheus persistent volume

**What happens**:
- Time-series database optimized for append-only writes
- Data stored in 2-hour blocks
- Automatic compaction of old blocks
- Retention policy (default 15 days)
- Efficient compression (10-20x)

**Query performance**: Optimized for recent data queries

### Step 6: Alert Evaluation
**Where**: Prometheus rule evaluator

**What happens**:
1. Every 30 seconds (defined in PrometheusRule):
   ```yaml
   interval: 30s
   ```
2. Evaluates PromQL expressions from `prometheus-rules.yaml`
3. Example rule:
   ```yaml
   - alert: HighHTTPErrorRate
     expr: |
       sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
       /
       sum(rate(http_requests_total[5m])) by (job) > 0.05
     for: 5m
   ```
4. If condition `true` for 5 minutes → fires alert
5. Alert includes:
   - Alert name
   - Labels (severity, service)
   - Annotations (summary, description)
   - Current value

### Step 7: Alert Routing (AlertManager)
**Where**: AlertManager service

**What happens**:
1. Receives alert from Prometheus
2. Groups similar alerts (e.g., all pod restarts)
3. Deduplicates identical alerts
4. Applies routing rules:
   - Critical → PagerDuty
   - Warning → Slack
   - Info → Email
5. Handles silences (temporarily mute alerts)
6. Sends notification to configured receivers

### Step 8: Visualization (Grafana)
**Where**: Grafana dashboard

**What happens**:
1. User opens dashboard in Grafana
2. Dashboard defines panels with PromQL queries:
   ```promql
   rate(http_server_requests_seconds_count{job="cart-service"}[5m])
   ```
3. Grafana queries Prometheus API every 5-30 seconds (refresh interval)
4. Prometheus executes query against TSDB
5. Returns time-series data
6. Grafana renders graph/gauge/table
7. User sees real-time visualization

---

## Files & Configuration

### File Structure
```
K8s-Project2/
├── setup-monitoring.sh              # Automated installation script
├── monitoring_manual.md             # This documentation
├── MONITORING-GUIDE.md              # Step-by-step setup guide
└── kubernetes/
    ├── servicemonitor.yaml          # Scrape targets configuration
    ├── prometheus-rules.yaml        # Alert definitions
    └── monitoring-nodeport.yaml     # External access services
```

### 1. setup-monitoring.sh
**Purpose**: One-command monitoring stack deployment

**What it does**:
```bash
#!/bin/bash
# 1. Add Helm repos (Prometheus + Grafana charts)
# 2. Create 'monitoring' namespace
# 3. Install kube-prometheus-stack via Helm
# 4. Apply NodePort services for external access
# 5. Create ServiceMonitors for microservices
# 6. Apply alert rules
```

**Key Helm values**:
```bash
--set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
# ^ Allows Prometheus to discover ServiceMonitors in ANY namespace

--set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false
# ^ Allows Prometheus to discover PodMonitors in ANY namespace

--set grafana.adminPassword=admin123
# ^ Sets Grafana admin password
```

**Usage**:
```bash
chmod +x setup-monitoring.sh
./setup-monitoring.sh
```

### 2. servicemonitor.yaml
**Purpose**: Tells Prometheus which services to scrape

**Structure** (per service):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: cart-service-monitor      # ServiceMonitor name
  namespace: default               # Where your app runs
  labels:
    app: cart-service
spec:
  selector:
    matchLabels:
      app: cart-service            # Matches Service labels
  endpoints:
  - port: http                     # Service port name
    path: /actuator/prometheus     # Metrics endpoint path
    interval: 30s                  # Scrape every 30 seconds
    scrapeTimeout: 10s             # Timeout after 10 seconds
```

**How it works**:
1. Prometheus Operator finds ServiceMonitor
2. Looks for Service with label `app: cart-service`
3. Gets all pod IPs behind that Service
4. Generates scrape config for each pod
5. Prometheus starts scraping those endpoints

**Services configured**:
- user-service (port 8001)
- event-service (port 8002)
- booking-service (port 8003)
- cart-service (port 8004)

### 3. prometheus-rules.yaml
**Purpose**: Defines alert conditions

**Structure**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: application-alerts
  namespace: monitoring
spec:
  groups:
  - name: application.rules
    interval: 30s                  # Evaluate every 30 seconds
    rules:
    - alert: HighHTTPErrorRate     # Alert name
      expr: |                      # PromQL expression
        sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
        /
        sum(rate(http_requests_total[5m])) by (job) > 0.05
      for: 5m                      # Must be true for 5 minutes
      labels:
        severity: warning          # Alert severity
        service: "{{ $labels.job }}"
      annotations:
        summary: "High HTTP error rate on {{ $labels.job }}"
        description: "Error rate is {{ $value | humanizePercentage }}"
```

**Alert categories**:

**Application Alerts**:
- `HighHTTPErrorRate`: 5xx errors > 5%
- `ServiceResponseTimeHigh`: P95 latency > 1 second
- `JVMMemoryUsageHigh`: Heap usage > 85%
- `PodCrashLoop`: Pod restarting frequently
- `DatabaseConnectionHigh`: MySQL connections > 80
- `RedisMemoryHigh`: Redis memory > 85%
- `PodNotReady`: Pod not in Running state

**Infrastructure Alerts**:
- `NodeMemoryPressure`: Node running low on memory
- `NodeDiskPressure`: Node running low on disk
- `NodeNotReady`: Node not ready for scheduling

### 4. monitoring-nodeport.yaml
**Purpose**: Expose monitoring tools outside the cluster

**Services created**:

```yaml
# Prometheus (port 30090)
- Prometheus UI: http://<node-ip>:30090
- View targets: /targets
- View alerts: /alerts
- Query metrics: /graph

# Grafana (port 30300)
- Dashboard UI: http://<node-ip>:30300
- Login: admin / admin123
- Import dashboards
- Create custom dashboards

# AlertManager (port 30093)
- Alert UI: http://<node-ip>:30093
- View active alerts
- Silence alerts
- Configure receivers
```

**Why NodePort?**:
- Allows access from outside cluster
- Fixed port numbers (easy to remember)
- Alternative to LoadBalancer (no cloud dependency)
- Good for dev/test environments

**Production alternative**: Use Ingress with TLS

### 5. Spring Boot Configuration

**pom.xml dependencies**:
```xml
<!-- Prometheus metrics -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- Actuator endpoints -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**application.properties**:
```properties
# Expose prometheus endpoint
management.endpoints.web.exposure.include=health,info,metrics,prometheus

# Enable Prometheus metrics export
management.metrics.export.prometheus.enabled=true

# Application name (used as 'job' label in Prometheus)
spring.application.name=cart-service
```

**What gets exposed**:
- `/actuator/health`: Health check endpoint
- `/actuator/info`: Application info
- `/actuator/metrics`: All available metrics (JSON)
- `/actuator/prometheus`: Prometheus format (scraped by Prometheus)

---

## What Gets Monitored

### Infrastructure Layer (Node Exporter + kube-state-metrics)

**Node Metrics**:
- CPU: usage per core, idle, system, user
- Memory: total, used, free, cached, buffers
- Disk: I/O operations, read/write bytes, usage %
- Network: packets sent/received, errors, drops
- Load average: 1m, 5m, 15m

**Kubernetes Metrics**:
- Pod status: Running, Pending, Failed, Unknown
- Pod restarts: count, reasons
- Container resource usage: CPU, memory, disk
- Node conditions: Ready, MemoryPressure, DiskPressure
- Deployment status: desired vs available replicas

### Application Layer (Spring Boot Actuator + Micrometer)

**HTTP Metrics**:
```
http_server_requests_seconds_count    # Total request count
http_server_requests_seconds_sum      # Total response time
http_server_requests_seconds_max      # Max response time

Labels: method, uri, status, exception
```

**Example queries**:
- Request rate: `rate(http_server_requests_seconds_count[5m])`
- Error rate: `rate(http_server_requests_seconds_count{status=~"5.."}[5m])`
- P95 latency: `histogram_quantile(0.95, http_server_requests_seconds_bucket)`

**JVM Metrics**:
```
jvm_memory_used_bytes                 # Heap/non-heap usage
jvm_memory_max_bytes                  # Max heap/non-heap
jvm_gc_pause_seconds_count            # GC count
jvm_gc_pause_seconds_sum              # Total GC time
jvm_threads_live                      # Active threads
jvm_threads_peak                      # Peak thread count
jvm_classes_loaded                    # Loaded classes
```

**Database Metrics (HikariCP)**:
```
hikaricp_connections_active           # Active connections
hikaricp_connections_idle             # Idle connections
hikaricp_connections_pending          # Pending connection requests
hikaricp_connections_timeout_total    # Connection timeout count
hikaricp_connections_creation_seconds # Connection creation time
```

**Redis Metrics (Lettuce Client)**:
```
redis_command_latency_seconds         # Command latency
redis_connections_active              # Active connections
redis_connections_idle                # Idle connections
```

**Tomcat Metrics**:
```
tomcat_threads_busy                   # Busy threads
tomcat_threads_current                # Current threads
tomcat_sessions_active_current        # Active sessions
tomcat_sessions_created_total         # Total sessions created
```

**Custom Business Metrics** (if added):
```java
// Example: Track cart additions
@Timed(value = "cart.additions", description = "Cart addition events")
public void addToCart(CartItem item) {
    // Your code
    cartAddCounter.increment();
}
```

### Database Layer (MySQL Exporter - if configured)

```
mysql_global_status_connections       # Total connections
mysql_global_status_threads_connected # Active connections
mysql_global_status_queries           # Total queries
mysql_global_status_slow_queries      # Slow queries
mysql_global_variables_max_connections # Max connections limit
```

### Redis Layer (Redis Exporter - if configured)

```
redis_memory_used_bytes               # Memory usage
redis_memory_max_bytes                # Memory limit
redis_connected_clients               # Connected clients
redis_commands_processed_total        # Total commands
redis_keyspace_hits_total             # Cache hits
redis_keyspace_misses_total           # Cache misses
```

---

## Quick Command Reference

### Installation
```bash
# Run automated setup
chmod +x setup-monitoring.sh
./setup-monitoring.sh

# Manual Helm install
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123
```

### Verification
```bash
# Check all monitoring pods
kubectl get pods -n monitoring

# Check ServiceMonitors
kubectl get servicemonitor -n default

# Check PrometheusRules
kubectl get prometheusrule -n monitoring

# Check scrape targets
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Visit: http://localhost:9090/targets
```

### Access Services
```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 --address 0.0.0.0 &

# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80 --address 0.0.0.0 &

# Port-forward AlertManager
kubectl port-forward -n monitoring svc/prometheus-operated 9093:9093 --address 0.0.0.0 &

# Get Grafana admin password
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d && echo
```

### NodePort Access (if applied)
```bash
# Get node IP
kubectl get nodes -o wide

# Access URLs
Prometheus:   http://<node-ip>:30090
Grafana:      http://<node-ip>:30300
AlertManager: http://<node-ip>:30093
```

### Debugging
```bash
# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus -f

# Check Grafana logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana -f

# Check Operator logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus-operator -f

# Describe ServiceMonitor
kubectl describe servicemonitor cart-service-monitor -n default

# Check if metrics endpoint is working
kubectl run tmp-shell --rm -i --tty --image nicolaka/netshoot -- /bin/bash
curl http://cart-service:8004/actuator/prometheus
```

### Useful PromQL Queries

**Request Rate**:
```promql
# Total requests per second
sum(rate(http_server_requests_seconds_count[5m]))

# By service
sum(rate(http_server_requests_seconds_count[5m])) by (job)

# By endpoint
sum(rate(http_server_requests_seconds_count[5m])) by (uri)
```

**Error Rate**:
```promql
# 5xx error percentage
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m])) * 100
```

**Latency**:
```promql
# P95 latency
histogram_quantile(0.95, 
  sum(rate(http_server_requests_seconds_bucket[5m])) by (le, job)
)

# Average latency
sum(rate(http_server_requests_seconds_sum[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
```

**JVM Memory**:
```promql
# Heap usage percentage
jvm_memory_used_bytes{area="heap"}
/
jvm_memory_max_bytes{area="heap"} * 100

# GC rate
rate(jvm_gc_pause_seconds_count[5m])
```

**Pod Health**:
```promql
# Pods not ready
sum by (pod) (kube_pod_status_phase{phase!="Running"})

# Container restarts (last 1 hour)
increase(kube_pod_container_status_restarts_total[1h])
```

### Grafana Dashboard IDs (Import from grafana.com)
```
1860  - Node Exporter / Nodes (infrastructure)
15759 - Kubernetes / Kube-Prometheus-Stack (k8s overview)
11378 - JVM Micrometer (Spring Boot apps)
12239 - Kubernetes Pod Monitoring (pod details)
7249  - Kubernetes Cluster Monitoring (cluster overview)
```

### Cleanup
```bash
# Remove monitoring stack
helm uninstall prometheus -n monitoring

# Delete namespace
kubectl delete namespace monitoring

# Delete ServiceMonitors
kubectl delete servicemonitor --all -n default

# Delete PrometheusRules
kubectl delete prometheusrule application-alerts -n monitoring
```

---

## Troubleshooting

### ServiceMonitor not working
```bash
# Check if Prometheus can see it
kubectl get servicemonitor -n default

# Check Prometheus logs for scrape errors
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus | grep -i error

# Verify service exists with correct labels
kubectl get svc cart-service -o yaml | grep -A5 labels

# Test metrics endpoint manually
kubectl port-forward svc/cart-service 8004:8004
curl http://localhost:8004/actuator/prometheus
```

### No metrics appearing in Prometheus
1. Check target status: `http://<prometheus-url>:9090/targets`
2. Look for "DOWN" targets with error messages
3. Common issues:
   - Pod not exposing port
   - Wrong path (should be `/actuator/prometheus`)
   - Actuator not enabled in application.properties
   - ServiceMonitor selector doesn't match Service labels

### Alerts not firing
```bash
# Check alert rules loaded
# Visit: http://<prometheus-url>:9090/alerts

# Check PrometheusRule is applied
kubectl get prometheusrule -n monitoring

# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus | grep -i alert

# Verify alert expression returns data
# Run PromQL query in Prometheus UI
```

### Grafana can't connect to Prometheus
```bash
# Check datasource configuration
# Grafana → Settings → Data Sources → Prometheus

# Should be: http://prometheus-kube-prometheus-prometheus.monitoring.svc:9090

# Test from Grafana pod
kubectl exec -n monitoring -it <grafana-pod> -- /bin/sh
wget -O- http://prometheus-kube-prometheus-prometheus.monitoring.svc:9090/api/v1/query?query=up
```

---

## Best Practices

### Metric Naming
- Use underscores: `http_requests_total` (not `httpRequestsTotal`)
- Suffix counters with `_total`
- Suffix gauges with descriptive unit: `_bytes`, `_seconds`, `_ratio`
- Use base units: seconds (not milliseconds), bytes (not MB)

### Labels
- Keep cardinality low (avoid user IDs, timestamps as labels)
- Use consistent label names across metrics
- Common labels: `job`, `instance`, `method`, `status`, `uri`
- Don't create labels with unbounded values

### Alert Design
- Alert on symptoms, not causes
- Set appropriate `for:` duration (avoid flapping)
- Use severity levels: `critical` (page), `warning` (ticket), `info` (log)
- Include actionable information in annotations
- Test alerts by simulating conditions

### Dashboard Design
- Organize by service or layer
- Use time range variables
- Add descriptions to panels
- Use consistent color schemes
- Set appropriate refresh intervals (5-30s)

### Resource Limits
```yaml
# Prometheus
resources:
  requests:
    memory: "2Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"

# Grafana
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

---

## Summary

You now have a complete monitoring solution that:

✅ **Automatically discovers** new services via ServiceMonitors  
✅ **Collects metrics** from all microservices every 30 seconds  
✅ **Stores time-series data** with 15-day retention  
✅ **Evaluates alerts** based on conditions you define  
✅ **Visualizes metrics** in real-time Grafana dashboards  
✅ **Scales automatically** with pod replicas  
✅ **Provides deep insights** into infrastructure, Kubernetes, applications, JVM, and databases

**Next steps**:
1. Import Grafana dashboards (IDs: 1860, 15759, 11378)
2. Configure AlertManager receivers (Slack, email)
3. Add custom business metrics to your code
4. Create service-specific dashboards
5. Set up persistent storage for Prometheus (PVC)
