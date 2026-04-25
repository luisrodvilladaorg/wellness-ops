<<<<<<< Updated upstream
# Deployment flow

This project uses a two-pipeline GitOps model: a **CI Quality Gate** that protects `main`, and a **CD DEV** pipeline that deploys every merge automatically.
=======
# 🚀 Deployment flow (dev, staging, prod)

Short version: the platform now runs a full three-environment GitOps flow from code change to Kubernetes rollout.
>>>>>>> Stashed changes

## At a glance

- **Source repo:** `wellness-ops`
- **GitOps repo:** `wellness-gitops`
- **Registry:** GHCR
- **Delivery model:** GitHub Actions + ArgoCD
<<<<<<< Updated upstream
- **CI trigger:** pull request targeting `main`
- **CD trigger:** push to `main` (merge)

---

## Pipelines

### CI — Quality Gate (`ci.yml`)

Runs on every **pull request to `main`**. Merge is blocked until this passes.

| Job | What it does |
|---|---|
| `lint-and-test` | `npm ci` → `npm run lint` → `npm test` |
| `build-and-scan` | Builds `backend/Dockerfile.prod`, runs Trivy (CRITICAL blocker), then discards the image |

The image built here is **never pushed** — its only purpose is to catch vulnerabilities before they reach the registry.

### CD — Deploy DEV (`cd-dev.yml`)

Runs on every **push to `main`** (i.e., after a PR merges). Tags images with the commit SHA.

| Job | What it does |
|---|---|
| `build-backend` | Builds + Trivy scan + pushes `wellness-ops-backend:<sha>` to GHCR |
| `build-frontend` | Builds + Trivy scan + pushes `wellness-ops-frontend:<sha>` to GHCR |
| `update-gitops-dev` | Patches `k8s/overlays/dev/backend/patch-image.yml` and `k8s/overlays/dev/frontend/patch-image.yml` in `wellness-gitops`, then commits and pushes |

ArgoCD watches `wellness-gitops` and syncs the DEV cluster automatically once the GitOps commit lands.
=======
- **Active environments:** `dev`, `staging`, `prod`

---

## 🧭 Pipeline map

### Quality gate (before merge)

- Trigger: Pull Request to `main`
- Workflow: [wellness-ops/.github/workflows/ci.yml](../.github/workflows/ci.yml)
- Actions: lint + tests + build + Trivy scan

### DEV continuous deployment

- Trigger: push to `main`
- Workflow: [wellness-ops/.github/workflows/cd-dev.yml](../.github/workflows/cd-dev.yml)
- Result:
    - builds backend/frontend images,
    - scans with Trivy,
    - pushes tags to GHCR,
    - updates `k8s/overlays/dev/*/patch-image.yml` in GitOps.

### STAGING release-candidate deployment

- Trigger: release-candidate tag `v*.*.*-rc.*`
- Workflow: [wellness-ops/.github/workflows/cd-staging.yml](../.github/workflows/cd-staging.yml)
- Result:
    - builds backend/frontend images,
    - scans with Trivy,
    - pushes RC tags to GHCR,
    - updates `k8s/overlays/staging/*/patch-image.yml` in GitOps.

### PROD promotion

- Trigger: stable tag `v*.*.*`
- Promotion source: production promotion workflow in GitOps repository
- Result: updates `k8s/overlays/prod/*/patch-image.yml` and lets ArgoCD reconcile production.

---

## ☸️ Runtime reconciliation

After each GitOps commit, ArgoCD detects the desired-state change and syncs the target environment namespace (`dev`, `staging`, or `prod`).

Kubernetes performs rolling updates through the existing Deployment strategy (`RollingUpdate`, readiness, liveness).
>>>>>>> Stashed changes

---

## Full flow

```mermaid
<<<<<<< Updated upstream
flowchart TD
    A[Open PR] --> B[CI Quality Gate]
    B --> B1[Lint & Tests]
    B --> B2[Build + Trivy scan]
    B1 & B2 --> C{Pass?}
    C -- No --> D[PR blocked]
    C -- Yes --> E[Merge to main]
    E --> F[CD — Deploy DEV]
    F --> F1[Build + scan + push backend image]
    F --> F2[Build + scan + push frontend image]
    F1 & F2 --> G[Patch GitOps overlays/dev]
    G --> H[ArgoCD detects drift]
    H --> I[Kubernetes rolling update — DEV]
=======
flowchart LR
        A[PR to main] --> B[CI Quality Gate]
        B --> C[Merge to main]
        C --> D[CD DEV]
        D --> E[Tag v*.*.*-rc.*]
        E --> F[CD STAGING]
        F --> G[Tag v*.*.*]
        G --> H[CD PROD]
        H --> I[GitOps overlays updated]
        I --> J[ArgoCD sync]
        J --> K[Kubernetes rollout]
>>>>>>> Stashed changes
```

---

<<<<<<< Updated upstream
## Image naming

| Pipeline | Image tag | Example |
|---|---|---|
| CI (quality gate) | `ci-<sha>` — local only, deleted after scan | `wellness-ops-backend:ci-abc1234` |
| CD DEV | `<sha>` — pushed to GHCR | `wellness-ops-backend:abc1234` |

---

## Why it matters

- **Protected main:** no code lands without lint, tests, and a clean Trivy scan.
- **Continuous delivery to DEV:** every merge is live in the cluster within minutes, no manual steps.
- **Real GitOps:** the cluster state is driven by Git — ArgoCD never receives direct `kubectl apply` calls.
- **Traceable deployments:** SHA ties the running pod back to the exact commit.
=======
## 📸 Evidence placeholders

- TODO: add DEV pipeline + ArgoCD sync capture.
- TODO: add STAGING RC pipeline + ArgoCD sync capture.
- TODO: add PROD promotion + ArgoCD sync capture.
>>>>>>> Stashed changes

---

## Quick proof points

<<<<<<< Updated upstream
- CI workflow: [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- CD DEV workflow: [.github/workflows/cd-dev.yml](../.github/workflows/cd-dev.yml)
- GitOps DEV overlay: [wellness-gitops/k8s/overlays/dev](https://github.com/luisrodvilladaorg/wellness-gitops/tree/main/k8s/overlays/dev)

---

## One-line summary

**PR → CI Quality Gate → merge to main → CD DEV → GHCR images → GitOps patch → ArgoCD sync → Kubernetes DEV**
=======
**PR gate → dev deploy → staging RC deploy → prod promotion → ArgoCD sync → Kubernetes rollout**
>>>>>>> Stashed changes
