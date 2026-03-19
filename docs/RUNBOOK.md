# 🛠️ Operations Runbook — Wellness Ops

Practical guide to resolving three common incidents on the platform:

1. Ingress not starting or not routing traffic,
2. backend not connecting to PostgreSQL,
3. metrics not appearing in Prometheus/Grafana.

This document is designed for fast action with clear, verifiable steps.

![Monitoring status](images/monitoring.png)

---

## 🚨 Quick triage (2 minutes)

Before diving into details, run this block to get a snapshot of the current state:

```bash
kubectl get pods -A
kubectl get svc -A
kubectl get ingress -A
kubectl get endpoints -A
kubectl get certificate -A
```

What to look for:

- Pods in `CrashLoopBackOff`, `ImagePullBackOff`, or `Pending`.
- Services with no endpoints.
- Ingress with no address or incorrect host.
- TLS certificates not in `Ready` state.

---

## 1) 🌐 Ingress not starting or not routing traffic

### Typical symptoms

- `http://wellness.local` or `https://wellness.local` does not respond.
- 404/502/504 response when accessing via domain.
- `curl` to `/api/health` fails from the host.

### Step-by-step diagnosis

#### Step A — Verify Ingress resources

```bash
kubectl get ingress -A
kubectl describe ingress wellness-ingress-http -n default
kubectl describe ingress wellness-ingress -n default
```

Validate:

- `ingressClassName: nginx`.
- host set to `wellness.local`.
- rules for `/` and `/api` pointing to valid services.

References:

- [k8s/ingress/ingress-http.yml](../k8s/ingress/ingress-http.yml)
- [k8s/tls/wellness-ingress.yml](../k8s/tls/wellness-ingress.yml)

#### Step B — Verify the NGINX controller

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx -o wide
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100
```

Validate:

- controller is in `Running` state.
- controller service has an IP and exposed ports.
- no configuration errors in the logs.

#### Step C — Verify backend/frontend behind Ingress

```bash
kubectl get svc backend-service frontend-service nginx-gateway -n default
kubectl get endpoints backend-service frontend-service nginx-gateway -n default
```

If a service has no endpoints, Ingress will have nowhere to route traffic.

#### Step D — Verify domain resolution from the host

```bash
getent hosts wellness.local
```

Should resolve to the IP exposed by the Ingress/MetalLB in your environment.

#### Step E — End-to-end connectivity test

```bash
curl -v http://wellness.local/health --connect-timeout 5
curl -vk https://wellness.local/api/health --connect-timeout 5
```

### Common causes

- Incorrect host in Ingress.
- Ingress class not aligned with NGINX.
- Target service has no endpoints.
- `wellness.local` not resolving correctly on the host.
- TLS certificate not issued or not associated.

### Suggested quick fix

1. Apply the ingress manifests:

```bash
kubectl apply -f k8s/ingress/ingress-http.yml
kubectl apply -f k8s/tls/wellness-ingress.yml
```

2. Verify target services and endpoints.
3. Review/adjust `wellness.local` resolution on the host.
4. If applicable, review TLS (see the TLS strategy document).

### Resolution verification

- `curl` to `http://wellness.local/health` returns 200.
- `curl -k` to `https://wellness.local/api/health` returns OK.
- No errors in the NGINX controller logs.

---

## 2) 🗄️ Backend not connecting to the database

### Typical symptoms

- Backend in `CrashLoopBackOff`.
- Backend logs showing PostgreSQL connection errors.
- Health checks failing due to DB dependency.

### Step-by-step diagnosis

#### Step A — Check backend and postgres pod status

```bash
kubectl get pods -n default -l app=backend
kubectl get pods -n default -l app=postgres
kubectl describe pod -n default -l app=backend
kubectl logs -n default deploy/backend --tail=120
```

#### Step B — Validate the PostgreSQL service

```bash
kubectl get svc postgres-service -n default
kubectl get endpoints postgres-service -n default
```

An active endpoint must exist for `postgres-service:5432`.

Reference:

- [k8s/postgres/postgres-service.yml](../k8s/postgres/postgres-service.yml)

#### Step C — Validate backend configuration

```bash
kubectl get configmap backend-config -n default -o yaml
kubectl get secret backend-secret -n default -o yaml
```

Confirm expected keys:

- `DB_HOST=postgres-service`
- `DB_PORT=5432`
- `DB_NAME` configured
- credentials (`DB_USER`, `DB_PASSWORD`) present in the Secret

Reference:

- [k8s/backend/backend-config.yml](../k8s/backend/backend-config.yml)

#### Step D — Test connection from inside the cluster

```bash
kubectl run -it tmp-psql --rm --restart=Never --image=postgres:15 -- \
  sh -c 'pg_isready -h postgres-service -p 5432'
```

If this fails, the problem is network/DB service connectivity, not backend code.

#### Step E — Confirm backend startup behaviour

The backend uses a `pg` pool with startup retries via `waitForDB`.

Code references:

- [backend/src/db.js](../backend/src/db.js)
- [k8s/backend/backend-deployment.yml](../k8s/backend/backend-deployment.yml)

### Common causes

- `postgres-service` has no endpoints.
- Incomplete or incorrect credentials in the Secret.
- `wellness` database not created.
- DB not available at backend startup time.

### Suggested quick fix

1. Ensure postgres is healthy and has endpoints.
2. Re-validate the backend ConfigMap and Secret.
3. Re-apply backend and wait for the rollout:

```bash
kubectl apply -f k8s/backend/
kubectl rollout status deployment/backend -n default --timeout=180s
```

4. Review logs after the rollout:

```bash
kubectl logs -n default deploy/backend --tail=120
```

### Resolution verification

- Backend pods in `Running` + `Ready`.
- `/api/health` endpoint responds correctly.
- No DB errors in the backend logs.

---

## 3) 📈 Metrics not appearing

### Typical symptoms

- Grafana dashboards are empty.
- Prometheus has no backend series.
- `/metrics` endpoint is unreachable or returns no data.

### Step-by-step diagnosis

#### Step A — Verify the `/metrics` endpoint on the backend

```bash
kubectl port-forward -n default svc/backend-service 3000:3000
curl -s http://127.0.0.1:3000/metrics | head
```

Should return Prometheus-format metrics (`wellness_*`).

Code references:

- [backend/src/metrics.js](../backend/src/metrics.js)
- [backend/src/app.js](../backend/src/app.js)

#### Step B — Verify the Service and named port

```bash
kubectl get svc backend-service -n default -o yaml
kubectl get endpoints backend-service -n default
```

Validate:

- port `name: http`
- `port: 3000`
- active endpoints

Reference:

- [k8s/backend/backend-service.yml](../k8s/backend/backend-service.yml)

#### Step C — Verify the ServiceMonitor

```bash
kubectl get servicemonitor -A
kubectl describe servicemonitor backend-monitoring -n monitoring
```

Validate alignment:

- `selector.matchLabels.app=backend`
- namespace `default`
- endpoint `port: http`
- path `/metrics`

Reference:

- [monitoring-k8s/backend-servicemonitor.yml](../monitoring-k8s/backend-servicemonitor.yml)

#### Step D — Confirm Prometheus is discovering the target

```bash
kubectl get pods -n monitoring
kubectl logs -n monitoring deploy/monitoring-kube-prometheus-prometheus --tail=120
```

If that deployment name does not match your release, list first:

```bash
kubectl get deploy -n monitoring
```

### Common causes

- ServiceMonitor selector does not match the Service labels.
- Port name mismatch between Service and ServiceMonitor.
- `/metrics` not exposed or backend unavailable.
- Prometheus Operator/release in a different namespace.

### Suggested quick fix

1. Align labels, ports, and path between the Service and ServiceMonitor.
2. Re-apply the monitoring resources:

```bash
kubectl apply -f monitoring-k8s/backend-servicemonitor.yml
```

3. Validate the target and series after 1–2 scrape intervals.

### Resolution verification

- Backend target shows as `UP` in Prometheus.
- Queries for backend metrics return series.
- Grafana dashboard is showing data again.

![Backend metrics](images/metrics-2.png)
![Grafana Dashboard](images/metrics-grafana.png)

---

## 🧪 Incident closure checklist

At the end of any incident:

- Document the root cause in a short note.
- Record the command or action that resolved it.
- Leave evidence (screenshot or key output).
- Define a preventive improvement (alert, CI validation, or manifest adjustment).

---

## 📎 Useful repository references

- Ingress HTTP: [k8s/ingress/ingress-http.yml](../k8s/ingress/ingress-http.yml)
- Ingress TLS: [k8s/tls/wellness-ingress.yml](../k8s/tls/wellness-ingress.yml)
- TLS certificate: [k8s/tls/wellness-tls.yml](../k8s/tls/wellness-tls.yml)
- Backend deployment: [k8s/backend/backend-deployment.yml](../k8s/backend/backend-deployment.yml)
- Backend service: [k8s/backend/backend-service.yml](../k8s/backend/backend-service.yml)
- Backend config: [k8s/backend/backend-config.yml](../k8s/backend/backend-config.yml)
- ServiceMonitor: [monitoring-k8s/backend-servicemonitor.yml](../monitoring-k8s/backend-servicemonitor.yml)
- TLS troubleshooting history: [HTTPS.md](../HTTPS.md)

---

## ✅ Closing note

This runbook is designed to reduce diagnosis time and provide a clear resolution path for critical failures in traffic routing, data connectivity, and observability on Wellness Ops.
