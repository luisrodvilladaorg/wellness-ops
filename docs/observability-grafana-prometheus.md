# 📊 Why we use Prometheus + Grafana in Wellness Ops

This document explains, in a clear and direct way, why **Prometheus** and **Grafana** are a core part of the Wellness Ops architecture.

![Monitoring overview](images/monitoring.png)

## ✨ Executive summary

We chose this stack because it allows us to:

- **measure** the real state of the platform,
- **visualize** health and performance in real time,
- **detect** issues before they impact users,
- **make decisions** based on data instead of assumptions.

In short: we do not only deploy services, we also show the ability to **operate them with real observability**.

---

## 🧭 Role of each tool

### Prometheus = metrics engine

Prometheus collects and stores application and platform metrics as time-series data.

It provides:

- automated metric collection,
- historical queries for analysis,
- a foundation for alerts and SLOs,
- technical traceability during incidents.

### Grafana = visualization and analysis layer

Grafana consumes Prometheus data and turns it into dashboards useful for engineering and operations.

It provides:

- clear health and performance dashboards,
- comparison across versions and time windows,
- faster troubleshooting,
- visual communication of platform status.

![Grafana dashboard](images/metrics-grafana.png)

---

## ✅ What concrete value does this bring to the project?

### 1. Operational reliability

We can verify that the backend is truly performing well, not only that it is running.

### 2. Early degradation detection

If latency rises or error rates increase, we detect it quickly with evidence.

### 3. Release validation

After each release, we compare metrics and validate real production impact.

### 4. Smarter scaling decisions

With CPU, memory, RPS, and latency data, scaling decisions are based on real system behavior.

### 5. Strong engineering signal

It demonstrates DevOps maturity: build/deploy plus observability and continuous operations.

---

## 📌 Key metrics we track

- latency ($p50$, $p95$, $p99$),
- requests per second (RPS),
- error rates ($4xx$, $5xx$),
- CPU and memory usage,
- database connectivity health.

![Prometheus metrics](images/metrics-2.png)

---

## 🧩 How this fits in the Wellness Ops architecture

Prometheus and Grafana complement the CI/CD and Kubernetes flow:

1. a new version is deployed,
2. Prometheus captures real runtime behavior,
3. Grafana displays trends and health dashboards,
4. the team validates post-release stability and performance.

This closes the loop of a modern platform: **deliver, measure, learn, and improve**.

---

## 🔎 Repository references

- Prometheus base config (Docker): [monitoring-docker/prometheus.yml](../monitoring-docker/prometheus.yml)
- Kubernetes ServiceMonitor: [monitoring-k8s/backend-servicemonitor.yml](../monitoring-k8s/backend-servicemonitor.yml)
- General monitoring context: [README.md](../README.md)

---

## 💼 Final message

We use **Prometheus + Grafana** because we want to demonstrate professional platform operations: deploying microservices is not enough; you also need to **observe, diagnose, and optimize** them with real-time data.
