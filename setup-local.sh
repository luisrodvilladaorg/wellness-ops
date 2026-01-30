#Este fichero permite
#Instala cert‑manager (si no está instalado)
#Importa tus imágenes locales al cluster k3d
#Aplica tus manifests en el orden correcto
#./setup-local.sh
 
#!/bin/bash

set -e

CLUSTER_NAME="cluster-wellness-local"

echo "=== 1) Instalando cert-manager ==="
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

echo "Esperando a que cert-manager esté listo..."
kubectl wait --namespace cert-manager \
  --for=condition=Ready pods \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

echo "=== 2) Importando imágenes locales a k3d ==="
k3d image import nginx-dev:latest -c $CLUSTER_NAME
k3d image import frontend-dev:latest -c $CLUSTER_NAME
k3d image import backend-dev:latest -c $CLUSTER_NAME

echo "=== 3) Aplicando manifests ==="
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/nginx/
kubectl apply -f k8s/ingress/

echo "=== 4) Mostrando estado final ==="
kubectl get pods -A
kubectl get svc -A
kubectl get ingress -A

echo "=== Setup completado ==="
