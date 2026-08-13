# subite-admin (esqueleto)

Panel de administración interno de Subite. Ver `ADMIN_PANEL.md` (en la carpeta
de documentación) para el diseño completo, wireframes y modelo de endpoints.

## Requisitos
- Node.js 18+
- `subite-api` corriendo (o mockeado) para los endpoints `/admin/*`

## Uso

```bash
npm install
cp .env.example .env.local   # completar NEXT_PUBLIC_API_URL
npm run dev
```

Abrir `http://localhost:3000`.

## Estado actual (MVP esqueleto)

| Módulo | Estado |
|---|---|
| Login | UI lista, **falta conectar** a `/admin/auth/login` real (hoy simula) |
| Dashboard (KPIs + gráfico) | UI lista con datos mock, **falta conectar** a `/admin/dashboard/kpis` |
| Usuarios (listado + bloquear) | UI lista con datos mock, **falta conectar** a `/admin/usuarios` |
| Viajes / Reservas / Logs | Placeholders, a implementar en el segundo sprint |

Todos los puntos de conexión a la API real están marcados en el código con
comentarios `// MOCK — reemplazar por ...`.

## Estructura

```
app/
  login/page.tsx              -> pantalla de login
  (protected)/layout.tsx      -> sidebar + layout de las pantallas internas
  (protected)/dashboard/      -> KPIs + gráfico
  (protected)/usuarios/       -> tabla de usuarios
  (protected)/viajes/         -> placeholder
  (protected)/reservas/       -> placeholder
  (protected)/logs/           -> placeholder
components/
  KpiCard.tsx
  KpiChart.tsx
  UsersTable.tsx
lib/
  api.ts                      -> wrapper de fetch + funciones por endpoint admin
middleware.ts                 -> protección de rutas por cookie de sesión
```

## Deploy

Se dockeriza como un servicio más del `docker-compose` del VPS (junto a
`subite-api` y `postgres`), detrás de Nginx en un subdominio propio, ej.
`admin.subite.com`, con su certificado de Let's Encrypt.
