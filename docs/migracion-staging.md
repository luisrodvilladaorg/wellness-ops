```
═══════════════════════════════════════════════════════════════════
SESIÓN — Migración prod → staging + entornos
Fecha: 23 de abril de 2026
═══════════════════════════════════════════════════════════════════

─────────────────────────────────────────
OBJETIVO
─────────────────────────────────────────
Convertir el entorno default (prod) en staging.
Crear estructura de 3 entornos: dev → staging → production (mañana).

─────────────────────────────────────────
COMPLETADO
─────────────────────────────────────────

✅ Namespace staging creado
✅ AppProject wellness actualizado — namespace staging añadido a destinations
✅ Applications ArgoCD renombradas:
   backend-prod  → backend-staging  (path: k8s/overlays/staging/backend)
   frontend-prod → frontend-staging (path: k8s/overlays/staging/frontend)
   postgres-prod → postgres-staging (path: k8s/overlays/staging/postgres)
✅ Overlays prod/ renombrados a staging/:
   k8s/overlays/staging/backend/
     - kustomization.yml         (namespace: staging)
     - patch-image.yml
     - backend-jwt-sealedsecret.yml  (cifrado para staging)
   k8s/overlays/staging/frontend/
     - kustomization.yml         (namespace: staging)
     - patch-image.yml
   k8s/overlays/staging/postgres/
     - kustomization.yml         (namespace: staging)
     - postgres-ssl-sealedsecret.yml   (server.crt + server.key, cifrado para staging)
     - postgres-secret-sealedsecret.yml (POSTGRES_USER/PASSWORD/DB, cifrado para staging)
✅ Carpeta overlays/prod/ eliminada completamente
✅ Base postgres — securityContext eliminado (afecta dev y staging)
✅ Base postgres — SSL eliminado temporalmente (comando + volumen ssl)
✅ Postgres corriendo en staging sin SSL — BD wellness con tabla entries OK
✅ Backend corriendo en staging — conectividad a postgres-service:5432 OK

─────────────────────────────────────────
PROBLEMA PENDIENTE
─────────────────────────────────────────
❌ Backend no conecta a postgres — causa: SSL

db.js tiene:
  ssl: { rejectUnauthorized: false }

Postgres arrancó sin SSL (SSL eliminado de la base temporalmente).
El cliente intenta SSL handshake → postgres lo rechaza → 10 reintentos → crash.

Solución pendiente (dos opciones):
  A) Desactivar SSL en db.js:
       ssl: false  (o eliminar la línea)
       Requiere rebuild de imagen backend
  B) Reactivar SSL en postgres con los certs correctos
       Requiere resolver el problema de permisos del cert (defaultMode)

Recomendación: opción A para staging, opción B para production.

─────────────────────────────────────────
ESTADO DEL CLUSTER
─────────────────────────────────────────
Namespace staging:
  postgres-0          Running   (sin SSL, BD wellness OK)
  backend-*           CrashLoopBackOff (SSL mismatch con postgres)
  frontend-*          pendiente de verificar
  postgres-init       Completed

Namespace dev:
  Por verificar — base postgres también cambió (sin securityContext, sin SSL)
  Probable mismo problema de SSL en backend

─────────────────────────────────────────
SIGUIENTE SESIÓN
─────────────────────────────────────────
1. Arreglar SSL mismatch:
   - Modificar db.js → ssl: false para staging
   - Rebuild imagen backend → push → ArgoCD despliega
2. Verificar dev sigue funcionando
3. Crear namespace production + overlays/production/
4. Crear Applications ArgoCD production con approval gate
5. Retomar pipelines ci.yml y cd.yml

─────────────────────────────────────────
CREDENCIALES STAGING (no commitear)
─────────────────────────────────────────
postgres-secret:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: wellness
  POSTGRES_DB: wellness

backend-secret:
  DB_USER: postgres
  DB_PASSWORD: wellness
  DB_NAME: wellness
  DB_HOST: postgres-service (via ConfigMap backend-config)

─────────────────────────────────────────
REPOS
─────────────────────────────────────────
App:    /opt/wellness-ops      → github.com/luisrodvilladaorg/wellness-ops
GitOps: /opt/wellness-gitops   → github.com/luisrodvilladaorg/wellness-gitops
═══════════════════════════════════════════════════════════════════
```


