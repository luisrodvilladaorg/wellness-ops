# ===============================
# Kubernetes DevOps Makefile
# ===============================

# Default variables
NAMESPACE ?= default
APP ?= backend
POD ?=
K8S_DIR ?= k8s

# Deployments
FRONTEND_DEPLOYMENT ?= frontend
BACKEND_DEPLOYMENT ?= backend

# ===============================
# Cluster info
# ===============================

nodes:
	kubectl get nodes

namespaces:
	kubectl get namespaces

# ===============================
# Workloads
# ===============================

pods:
	kubectl get pods -n $(NAMESPACE)

deployments:
	kubectl get deployments -n $(NAMESPACE)

services:
	kubectl get services -n $(NAMESPACE)

describe-pods:
	kubectl describe pods -n $(NAMESPACE)

# ===============================
# Apply / Delete resources
# ===============================

apply:
	kubectl apply -f $(K8S_DIR)

delete:
	kubectl delete -f $(K8S_DIR)

# ===============================
# Logs
# ===============================

logs:
	kubectl logs -n $(NAMESPACE) -l app=$(APP)

logs-follow:
	kubectl logs -f -n $(NAMESPACE) -l app=$(APP)

# ===============================
# Debug
# ===============================

exec:
	kubectl exec -it -n $(NAMESPACE) $(POD) -- /bin/sh

# ===============================
# Watch resources
# ===============================

watch-pods:
	kubectl get pods -n $(NAMESPACE) -w

# ===============================
# Rollouts
# ===============================

restart-backend:
	kubectl rollout restart deployment/$(BACKEND_DEPLOYMENT) -n $(NAMESPACE)

restart-frontend:
	kubectl rollout restart deployment/$(FRONTEND_DEPLOYMENT) -n $(NAMESPACE)

rollout-status-backend:
	kubectl rollout status deployment/$(BACKEND_DEPLOYMENT) -n $(NAMESPACE)

rollout-status-frontend:
	kubectl rollout status deployment/$(FRONTEND_DEPLOYMENT) -n $(NAMESPACE)

# ===============================
# Port Forward
# ===============================

port-forward-backend:
	kubectl port-forward deployment/$(BACKEND_DEPLOYMENT) 3000:3000 -n $(NAMESPACE)

port-forward-frontend:
	kubectl port-forward deployment/$(FRONTEND_DEPLOYMENT) 8080:80 -n $(NAMESPACE)