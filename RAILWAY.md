# Deploy en Railway

## Servicio
- Repo: `juanpbeloso/covoiturage-admin-panel`
- Root: raíz del repo (Next.js 14)
- Railway detecta `npm run build` + `npm run start` automáticamente.

## Variables

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | URL de la API Subite (ej. `https://fearless-unity-production-04ec.up.railway.app`) |
| `AUTH_COOKIE_NAME` | `subite_admin_session` (opcional) |

## Networking
Generar dominio público en Railway → abrir la URL del panel.

## Notas
- `next.config.js` usa `output: "standalone"` (compatible con Docker/Railway).
- El login aún usa mock; conectar a `/admin/auth/login` cuando la API lo exponga.
