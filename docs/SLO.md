# SLO — wellness-ops
**Versión:** 1.0  
**Fecha:** 22 de abril de 2026  
**Entorno:** Producción (namespace `default`, cluster k3s)

---

## Definiciones

| Término | Definición |
|---|---|
| **SLI** | Métrica concreta que se mide |
| **SLO** | Objetivo de calidad interno sobre ese SLI |
| **Error Budget** | Margen de fallo permitido antes de romper el SLO |

---

## SLO-1 — Disponibilidad de la API

**SLI:** Porcentaje de requests HTTP que devuelven status 2xx o 3xx sobre el total de requests.

**Query Prometheus:**
```promql
sum(rate(nginx_ingress_controller_requests{status!~"5.."}[5m]))
/
sum(rate(nginx_ingress_controller_requests[5m]))
```

**Objetivo:** `>= 99.5%` en ventana de 30 días  
**Error Budget:** `0.5%` — equivale a ~3.6 horas de downtime al mes  
**Alerta asociada:** `HighErrorRate` (dispara cuando 5xx > 5% en 5 minutos)

---

## SLO-2 — Disponibilidad de PostgreSQL

**SLI:** Pod de PostgreSQL en estado Running.

**Query Prometheus:**
```promql
kube_pod_status_phase{namespace="default", pod=~"postgres.*"} == 1
```

**Objetivo:** `>= 99.9%` en ventana de 30 días  
**Error Budget:** `0.1%` — equivale a ~43 minutos de downtime al mes  
**Alerta asociada:** `PostgresDown` (dispara si postgres no está Running por 1 minuto)

---

## SLO-3 — Estabilidad de Pods

**SLI:** Pods del namespace `default` sin reinicios excesivos.

**Query Prometheus:**
```promql
increase(kube_pod_container_status_restarts_total{namespace="default"}[15m])
```

**Objetivo:** Ningún pod con más de 5 reinicios en 15 minutos  
**Alerta asociada:** `PodRestartingTooMuch` (severity: warning)

---

## Error Budget — resumen

| SLO | Objetivo | Downtime permitido/mes |
|---|---|---|
| API Disponibilidad | 99.5% | ~3.6 horas |
| PostgreSQL | 99.9% | ~43 minutos |
| Estabilidad Pods | 0 reinicios excesivos | N/A |

---

## Pendientes

- [ ] Añadir SLO de latencia cuando `prom-client` esté integrado en el backend
- [ ] Dashboard Grafana con burn rate del error budget