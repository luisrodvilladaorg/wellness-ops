# 🔐 Seguridad en Wellness Ops

Este documento describe las amenazas consideradas para esta plataforma Kubernetes y las medidas concretas que se han implementado o planificado para mitigarlas.

---

## ⚠️ Amenazas básicas consideradas

En una plataforma Kubernetes con CI/CD, GitHub Actions, Ingress expuesto y base de datos, las amenazas relevantes se agrupan en tres niveles:

### 1. Nivel de acceso y permisos

| Amenaza | Descripción |
|---|---|
| Acceso no autorizado al clúster | Un usuario o proceso obtiene permisos que no le corresponden |
| Escalada de privilegios | Un pod o SA obtiene acceso a recursos fuera de su ámbito |
| Service accounts con permisos excesivos | Por defecto, `default` SA en Kubernetes tiene acceso amplio |
| Acceso lateral entre namespaces | Un pod comprometido puede alcanzar otros servicios del clúster |

### 2. Nivel de imagen y cadena de suministro

| Amenaza | Descripción |
|---|---|
| Imagen con vulnerabilidades conocidas (CVEs) | Dependencias desactualizadas o imágenes base inseguras |
| Imagen modificada en tránsito | Sin verificación de integridad del artefacto |
| Credenciales en el Dockerfile o código fuente | Secrets hardcodeados en la imagen |

### 3. Nivel de secretos y configuración

| Amenaza | Descripción |
|---|---|
| Secrets en texto plano en Git | Contraseñas visibles en el repositorio |
| Variables sensibles en ConfigMaps | Datos que deberían estar cifrados pero no lo están |
| Tokens de acceso (GitHub, GHCR) con vida larga | Sin rotación ni scope limitado |

---

## 🛡️ Medidas implementadas

### 1. RBAC — Control de acceso basado en roles

El principio es simple: cada identidad (usuario, ServiceAccount, proceso) sólo puede hacer lo estrictamente necesario.

#### ¿Qué se ha configurado?

**Role con permisos mínimos** (namespaced, sólo lectura de pods):

```yaml
# k8s/rback/role-read-pods/role.yml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: rbac-lab
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

**ServiceAccount dedicada** (en lugar de usar `default`):

```yaml
# k8s/rback/role-read-pods/serviceaccount.yml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: developer-juan
  namespace: rbac-lab
```

**ClusterRole para acceso global de sólo lectura** (cuando el scope necesita abarcar el clúster):

```yaml
# k8s/rback/cluster-role/clusterrole.yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader-global
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

Referencias:
- [k8s/rback/role-read-pods/](../k8s/rback/role-read-pods/)
- [k8s/rback/cluster-role/](../k8s/rback/cluster-role/)

#### Por qué importa

Sin RBAC bien definido, cualquier pod comprometido puede listar secretos, escalar privilegios o modificar deployments del clúster entero. Con `Role` namespaced y `ServiceAccount` específica, el radio de daño de un compromiso queda acotado al namespace y a los verbos permitidos.

---

### 2. NetworkPolicy — Aislamiento de tráfico de red

Kubernetes por defecto permite comunicación libre entre todos los pods de todos los namespaces. Las `NetworkPolicy` establecen reglas de red declarativas que restringen ese tráfico.

#### ¿Qué debería aplicarse en este proyecto?

Actualmente el proyecto no tiene NetworkPolicies aplicadas (el clúster usa k3s con Flannel CNI, que sí las soporta). El siguiente ejemplo es la política recomendada para el backend:

```yaml
# Ejemplo recomendado: k8s/network/backend-network-policy.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-only-ingress-and-postgres
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to: []           # permite salida DNS (puerto 53 UDP)
      ports:
        - protocol: UDP
          port: 53
```

#### Lo que conseguimos con esto

- El backend sólo acepta tráfico entrante desde el Ingress Controller.
- El backend sólo puede salir hacia postgres en el puerto 5432 y hacia DNS.
- Ningún otro pod puede alcanzar el backend directamente.

#### Por qué importa

Si un pod en otro namespace del clúster queda comprometido, no puede acceder al backend ni a la base de datos. El movimiento lateral queda bloqueado por defecto.

---

### 3. Image Scanning — Escaneo de vulnerabilidades en CI

Las imágenes Docker pueden contener librerías con CVEs conocidos. Detectarlos en la pipeline antes de que la imagen llegue a producción es una medida preventiva fundamental.

#### Estado actual

La pipeline actual ([.github/workflows/kubernetes-build-push-images.yml](../.github/workflows/kubernetes-build-push-images.yml)) construye y sube imágenes a GHCR pero **no incluye escaneo de vulnerabilidades**.

#### Integración recomendada con Trivy

[Trivy](https://github.com/aquasecurity/trivy) es un escáner open-source de Aqua Security, usado ampliamente en entornos Kubernetes y soportado de forma nativa en GitHub Actions.

```yaml
# Añadir este step después del build, antes del push:
- name: Scan image with Trivy
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/${{ github.repository_owner }}/wellness-ops-backend:${{ github.ref_name }}
    format: table
    exit-code: '1'          # falla la pipeline si hay CVEs CRITICAL
    severity: 'CRITICAL,HIGH'
    ignore-unfixed: true    # ignora CVEs sin parche disponible
```

#### ¿Qué escanea Trivy?

- Vulnerabilidades en librerías del sistema base (Debian, Alpine…)
- Dependencias de Node.js listadas en `package.json`
- Ficheros de configuración con malas prácticas
- Secrets hardcodeados en la imagen

#### Umbrales recomendados

| Severidad | Acción sugerida |
|---|---|
| CRITICAL | Bloquear build — corrección obligatoria |
| HIGH | Bloquear build — corrección obligatoria |
| MEDIUM | Notificar — revisar en el sprint |
| LOW | Inventariar — sin bloqueo inmediato |

---

### 4. Gestión de Secrets — Evitar secretos en texto plano

Los secretos (contraseñas, tokens, claves JWT) son los datos más sensibles de cualquier plataforma. Exponerlos en Git o en logs es una de las vulnerabilidades más comunes y más graves.

#### Estrategia actual del proyecto

El proyecto aplica una estrategia en capas:

**Capa 1 — Kubernetes Secrets (base)**

Las credenciales de la base de datos y el token JWT se inyectan como variables de entorno a través de Secrets de Kubernetes, no de ConfigMaps.

```yaml
# k8s/backend/backend-secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
type: Opaque
stringData:
  DB_NAME: wellness
  DB_USER: postgres
  DB_PASSWORD: wellness
```

> ⚠️ Este fichero existe en el repositorio con valores de desarrollo. **En producción, este fichero no debe existir en Git.** Los valores deben gestionarse fuera del repositorio.

**Capa 2 — Sealed Secrets (cifrado en reposo para GitOps)**

Para el flujo GitOps con ArgoCD, el secreto de PostgreSQL se cifra con [Sealed Secrets de Bitnami](https://github.com/bitnami-labs/sealed-secrets) antes de subirse al repositorio.

```yaml
# k8s/postgres-sealed-secret.yml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: postgres-secret
  namespace: default
spec:
  encryptedData:
    POSTGRES_DB: AgCrvt/pkogBVde...   # cifrado con clave del clúster
    POSTGRES_PASSWORD: AgBCRwnpGigh...
    POSTGRES_USER: AgDI1cimGIZWro...
```

El controlador `sealed-secrets-controller` en el clúster descifra el `SealedSecret` y crea el `Secret` real en tiempo de ejecución. La clave de descifrado **nunca sale del clúster**.

Referencia: [k8s/postgres-sealed-secret.yml](../k8s/postgres-sealed-secret.yml)

**Capa 3 — GitHub Actions Secrets**

Los tokens necesarios para la pipeline (GHCR, kubeconfig) se almacenan como Secrets cifrados del repositorio en GitHub, nunca en el código:

```yaml
# Ejemplo de uso en el workflow:
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}   # token efímero por job
```

#### Buenas prácticas aplicadas

| Práctica | Estado |
|---|---|
| Credenciales DB en Secret, no en ConfigMap | ✅ Aplicado |
| Sealed Secrets para GitOps | ✅ Aplicado (producción) |
| Token GHCR no hardcodeado | ✅ `GITHUB_TOKEN` efímero |
| JWT Secret como Kubernetes Secret | ✅ `backend-jwt-secret` existe |
| Secret de desarrollo sin valores reales en Git | ⚠️ Pendiente de revisar |
| Rotación periódica de credenciales | ⚠️ Sin automatizar |

---

## 🔍 Resumen de postura de seguridad

| Área | Estado | Prioridad de mejora |
|---|---|---|
| RBAC con principio de mínimo privilegio | ✅ Configurado | Ampliar a todos los servicios |
| NetworkPolicy | ⚠️ Sin aplicar | Alta — implementar antes de exposición externa |
| Image scanning en CI | ❌ No configurado | Alta — añadir Trivy a la pipeline |
| Secrets en Kubernetes Secret | ✅ Aplicado | — |
| Sealed Secrets para GitOps | ✅ Aplicado | — |
| Secrets de desarrollo en Git | ⚠️ Revisar | Media — usar valores ficticios o excluir |
| Rotación de credenciales | ❌ Manual | Media — evaluar automatización |

---

## 📎 Referencias del repositorio

- RBAC (Role namespaced): [k8s/rback/role-read-pods/](../k8s/rback/role-read-pods/)
- RBAC (ClusterRole): [k8s/rback/cluster-role/](../k8s/rback/cluster-role/)
- Backend Secret: [k8s/backend/backend-secret.yml](../k8s/backend/backend-secret.yml)
- JWT Secret: [k8s/backend/backend-jwt-secret.yml](../k8s/backend/backend-jwt-secret.yml)
- Sealed Secret (postgres): [k8s/postgres-sealed-secret.yml](../k8s/postgres-sealed-secret.yml)
- Pipeline CI/CD: [.github/workflows/kubernetes-build-push-images.yml](../.github/workflows/kubernetes-build-push-images.yml)
