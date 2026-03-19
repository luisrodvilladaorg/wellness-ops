# 🌐 Domains used in Wellness Ops

This document summarizes the domains used in the project and the only local setup step needed to make the app work properly.

![Ingress and external access](images/ingress.png)

## ✨ Main domain

The Kubernetes ingress in this project is configured to use:

- `wellness.local`

This host appears in the ingress manifests, including [k8s/ingress/ingress-http.yml](../k8s/ingress/ingress-http.yml#L8) and the TLS manifests under [k8s/tls](../k8s/tls).

---

## 🧭 What each domain is used for

| Context | Domain / host | Purpose |
|---|---|---|
| Local Kubernetes access | `wellness.local` | Main entrypoint for the app through Ingress |
| Backend health checks | `https://wellness.local/api/health` | Verifies backend availability behind ingress |
| Local container checks | `localhost` | Used internally for some local container health checks |
| In-cluster database access | `postgres-service` | Internal Kubernetes service name for PostgreSQL |

---

## ⚠️ Important local requirement

If you want the application to work locally through Kubernetes ingress, you must map the domain in `/etc/hosts`.

Without this step, `wellness.local` will not resolve correctly from the browser.

### Required entry

```text
<INGRESS_IP> wellness.local
```

Example:

```text
172.19.255.200 wellness.local
```

---

## 🛠️ Why `/etc/hosts` matters

Ingress routing depends on the `Host` header.

That means:

- opening the app by raw IP is not enough,
- the browser must request `wellness.local`,
- the local machine must know how to resolve that hostname.

So for local testing, `/etc/hosts` is part of the setup.

---

## ✅ What to test after configuring it

Once the host entry is added, these checks should work:

- open `http://wellness.local`
- open `https://wellness.local`
- test `https://wellness.local/api/health`

If TLS is enabled with a local or self-signed certificate, browser warnings can still appear depending on the certificate trust setup.

---

## 🔎 Where this is defined

Key references in the repository:

- HTTP ingress host: [k8s/ingress/ingress-http.yml](../k8s/ingress/ingress-http.yml#L8)
- TLS ingress host: [k8s/tls/wellness-ingress.yml](../k8s/tls/wellness-ingress.yml#L17)
- TLS certificate hostname: [k8s/tls/wellness-tls.yml](../k8s/tls/wellness-tls.yml#L13-L15)
- Troubleshooting notes: [HTTPS.md](../HTTPS.md)

---

## 💼 Final takeaway

The project uses a clean local domain strategy:

- `wellness.local` for browser access through Kubernetes ingress,
- internal service names for cluster-to-cluster communication,
- a simple `/etc/hosts` mapping to make the local demo work reliably.
