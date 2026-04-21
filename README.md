# wellness-ops

[![CI DEV](https://img.shields.io/github/actions/workflow/status/luisrodvilladaorg/wellness-ops/dev.yml?branch=main&label=CI%20DEV)](https://github.com/luisrodvilladaorg/wellness-ops/actions/workflows/dev.yml)
[![CD PROD](https://img.shields.io/github/actions/workflow/status/luisrodvilladaorg/wellness-ops/prod.yml?label=CD%20PROD)](https://github.com/luisrodvilladaorg/wellness-ops/actions/workflows/prod.yml)
[![Last Commit](https://img.shields.io/github/last-commit/luisrodvilladaorg/wellness-ops?display_timestamp=committer&label=Last%20Commit&logo=github)](https://github.com/luisrodvilladaorg/wellness-ops/commits/main)
[![License](https://img.shields.io/github/license/luisrodvilladaorg/wellness-ops?label=License)](LICENSE)

# Production-grade Kubernetes platform — GitOps, CI/CD, TLS, and observability on k3s.

## Platform Overview

![Platform Overview](docs/images/wellness-ops.png)

## TL;DR

- **Stack**: Node.js backend + frontend + PostgreSQL on Kubernetes (k3s).
- **CI/CD**: GitHub Actions builds and pushes images to GHCR on every commit.
- **GitOps**: ArgoCD syncs desired state from [`wellness-gitops`](https://github.com/luisrodvilladaorg/wellness-gitops).
- **Environments**: `dev` and `prod` via Kustomize overlays.
- **Ingress**: NGINX Ingress Controller + TLS via `cert-manager`.
- **Observability**: Prometheus + Grafana via `ServiceMonitor`.
- **Security**: SealedSecrets, Trivy image scanning, Cosign image signing.
- **Promotion flow**: semantic tag `v*.*.*` triggers production deployment.

## Architecture (current)

![Architecture](docs/images/arquitecture.png)

## ArgoCD

![ArgoCD sync](docs/images/argocd.png)

## Running Pods

![Pods running (default)](docs/images/pods_running_default.png)

## Dev Namespace

![Pods running (dev)](docs/images/pods_running_dev.png)

## Monitoring

![Monitoring](docs/images/monitoring.png)

## CI/CD Pipeline

1. Push to `main` → `dev.yml` triggers build, pushes image to GHCR, updates `dev` overlay in `wellness-gitops`.
2. Tag `v*.*.*` → `prod.yml` promotes image to `prod` overlay in `wellness-gitops`.
3. ArgoCD detects the change and syncs the cluster automatically.

![Pipelines](docs/images/Pipelines.png)
![Backend CI](docs/images/backend-ci.png)
![Backend CD](docs/images/backend-cd.png)

## Prometheus

![Prometheus metrics](docs/images/metrics-2.png)

## Grafana

![Grafana dashboard](docs/images/metrics-grafana.png)

## Key Metrics

![Metrics](docs/images/metrics.png)

## External Access

### Ingress and Service Exposure

![Ingress external IP](docs/images/ingress.png)

![Ingress Service](docs/images/svc-ingress.png)

## API Validation

![cURL backend response](docs/images/curl-backend.png)

## Repository Model

- `wellness-ops`: application code, Dockerfiles, runtime configs, and operational docs.
- `wellness-gitops`: Kubernetes desired state (base + overlays) synchronized by ArgoCD.

## Infrastructure & GitOps

Kubernetes manifests and ArgoCD configuration live in a dedicated GitOps repository,
following the GitOps pattern to keep application code and deployment state separated.

-> [wellness-gitops](https://github.com/luisrodvilladaorg/wellness-gitops)

Architecture:

- CI pipeline builds and pushes images, then commits new image tags to the GitOps repo.
- ArgoCD watches the GitOps repo and syncs changes to the cluster automatically.
- Environments: `dev` / `prod` managed with Kustomize overlays.

This avoids duplicating Kubernetes source-of-truth manifests across repositories.

## Production Environment

Production environment with the promoted release and stable runtime configuration.

![Production environment](docs/images/wellness-ops-production.png)

## Dev Environment

Development environment focused on validation and fast iteration before production promotion.

![Dev environment](docs/images/wellness-ops-dev.png)

## What this project does today

- Builds frontend/backend images and publishes them to GHCR.
- Updates image tags in `wellness-gitops` via GitHub Actions.
- ArgoCD synchronizes desired state from Git to the cluster.
- HTTP(S) routing through NGINX Ingress:
  - `/api` -> `backend-service`
  - `/` -> `frontend-service`

### Internal Security: Backend <-> PostgreSQL

Backend-to-PostgreSQL traffic is handled through internal Kubernetes Services (`backend-service` and `postgres-service`) and is encrypted in transit with SSL/TLS.
PostgreSQL is configured with `ssl=on` and the backend connects using SSL (`ssl: { rejectUnauthorized: false }` for a self-signed certificate setup).
Operational validation confirmed active encrypted sessions (`TLSv1.3` with `AES-256-GCM`), while PostgreSQL remains private with no direct external exposure.

## Project Structure

```text
wellness-ops/
├── backend/                  # Node.js API, tests, Dockerfiles
│   ├── src/
│   └── test/
├── frontend/                 # Frontend app and production/dev Dockerfiles
│   └── mi-web/
├── db/                       # Database bootstrap SQL
│   └── init.sql
├── env/                      # Environment variable files per environment
│   ├── dev/
│   └── prod/
├── k8s/                      # Local reference manifests (non-canonical)
│   ├── backend/
│   ├── frontend/
│   ├── postgres/
│   ├── ingress/
│   ├── monitoring/
│   ├── metallb/
│   └── tls/
├── nginx/                    # NGINX configs and Dockerfiles
├── docs/                     # Runbook, security, deployment flow, architecture images
│   └── images/
├── monitoring-docker/        # Local Prometheus config
├── monitoring-k8s/           # ServiceMonitor manifests for Kubernetes
├── Docker-practica/          # Practice/lab sandbox
├── docker-compose*.yml       # Local and production-style compose stacks
├── Makefile                  # Operational shortcuts
└── README.md
```

### Folder guide

- `backend/`: API service, runtime logic, tests, and image build definitions.
- `frontend/`: static/frontend app and containerization config.
- `k8s/`: local reference manifests for practice and validation; canonical cluster desired state lives in `wellness-gitops`.
- `docs/`: operational and architecture documentation.
- `nginx/`: reverse-proxy configuration for container-based environments.
- `monitoring-*`: observability resources split by Docker and Kubernetes contexts.

## Current status (`dev` namespace)

Snapshot taken on **2026-03-21**:

- Pods: backend (2/2), frontend (1/1), postgres (1/1), init job completed.
- Services: `backend-service` (3000), `frontend-service` (80), `postgres-service` (5432).
- Deployments ready: backend (2 replicas), frontend (1 replica).

```bash
kubectl get all -n dev
```

## Observability

- Backend metrics are exposed and scraped by Prometheus via `ServiceMonitor`.
- Grafana dashboards are used for visualization.

> Alertmanager is not declared as a confirmed operational component in this primary repository.

## Quick usage

- Local startup (`dev`):

```bash
git clone https://github.com/luisrodvilladaorg/wellness-ops.git
cd wellness-ops
docker compose -f docker-compose.dev.yml up -d
```

- Kubernetes quick check (`dev`):

```bash
kubectl get all -n dev
```

## Resources

- [docs/RUNBOOK.md](docs/RUNBOOK.md)
- [docs/deployment-flow.md](docs/deployment-flow.md)
- [docs/ingress-controller.md](docs/ingress-controller.md)
- [docs/observability-grafana-prometheus.md](docs/observability-grafana-prometheus.md)
- [docs/SECURITY.md](docs/SECURITY.md)

## License

Project distributed under [LICENSE](LICENSE).

## Author

Luis Fernando Rodríguez Villada

luisfernando198912@gmail.com
