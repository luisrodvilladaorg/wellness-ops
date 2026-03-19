# 🔐 TLS strategy with cert-manager in Wellness Ops

This document provides a clear overview of how HTTPS traffic is secured in Kubernetes using **cert-manager**.

![Ingress and TLS entrypoint](images/ingress.png)

## ✨ Executive summary

In Wellness Ops, the TLS strategy is based on:

- **NGINX Ingress** for HTTPS termination,
- **cert-manager** for automated certificate issuance and renewal,
- an **internal CA** to sign platform domain certificates.

This provides transport security, automation, and operational traceability without manual certificate handling.

---

## 🧭 Strategy goals

The strategy targets three concrete outcomes:

1. encrypt all HTTP traffic with TLS,
2. avoid error-prone manual renewals,
3. keep the architecture reproducible in Kubernetes.

---

## 🏗️ How it is built in this project

The trust chain is implemented in 4 components:

### 1) `selfsigned-issuer` (bootstrap)

Initial issuer used to generate the internal CA.

- [k8s/tls/ca-issuer.yml](../k8s/tls/ca-issuer.yml)

### 2) CA certificate (`wellness-ca`)

Internal root CA certificate (10 years), stored as a Kubernetes secret.

- [k8s/tls/ca-certificate.yml](../k8s/tls/ca-certificate.yml)

### 3) CA `ClusterIssuer` (`wellness-ca`)

Reusable issuer used to sign ingress and service certificates.

- [k8s/tls/ca-clusterissuer.yml](../k8s/tls/ca-clusterissuer.yml)

### 4) Domain TLS certificate + Ingress

A certificate is issued for `wellness.local` and attached to the TLS ingress.

- Certificate: [k8s/tls/wellness-tls.yml](../k8s/tls/wellness-tls.yml)
- TLS ingress: [k8s/tls/wellness-ingress.yml](../k8s/tls/wellness-ingress.yml)

---

## 🔁 Automatic renewal

The current application certificate policy is:

- duration: `2160h` (90 days),
- renew before: `360h` (15 days before expiration).

With this setup, cert-manager rotates certificates automatically and reduces expiration risk.

---

## ✅ Benefits for the project

### 1. Real transport security

Connections to the domain are encrypted over HTTPS at the cluster entrypoint.

### 2. Lower operational risk

Manual renewal tasks and ad-hoc certificate operations are removed.

### 3. More professional architecture

The strategy is defined as code (manifests), versioned in Git, and auditable.

### 4. Platform scalability

The same pattern can be extended to additional services and domains without redesigning the foundation.

### 5. Strong engineering signal

It demonstrates practical Kubernetes security implementation, not only functional deployment.

---

## 🌐 Domain and resolution

The configured TLS host is `wellness.local`.

For workstation access, domain resolution (for example via `/etc/hosts`) must point to the IP exposed by Ingress/MetalLB.

Ingress host references:

- [k8s/tls/wellness-ingress.yml](../k8s/tls/wellness-ingress.yml#L17)
- [k8s/ingress/ingress-http.yml](../k8s/ingress/ingress-http.yml#L8)

---

## 🔎 Recommended verification

Simple checks after applying manifests:

- `kubectl get certificate -A`
- `kubectl describe certificate wellness-tls -n default`
- `kubectl get ingress -A`
- `curl -vk https://wellness.local/api/health`

For detailed historical TLS troubleshooting:

- [HTTPS.md](../HTTPS.md)

---

## 💼 Final message

The Wellness Ops TLS strategy combines **security**, **automation**, and **reliable operations**: cert-manager manages certificate lifecycle while NGINX Ingress applies HTTPS consistently at the cluster edge.
