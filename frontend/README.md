# Ideator - Frontend

SPA de Ideator construida con React 18, TypeScript, Vite y Tailwind CSS. Consume la API Spring Boot
del monorepo y adjunta el JWT en cada petición mediante Axios.

## Requisitos

- Node.js 20+
- Backend y PostgreSQL corriendo (ver `../README.md`)

## Comandos

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # TypeScript + build de producción
npm run typecheck # solo verificación de tipos
```

## Variables de entorno

Copia `.env.example` a `.env` si necesitas apuntar a otro backend:

```env
VITE_API_URL=http://localhost:8080/api
```

## Rutas

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/login` | Pública | Login y registro |
| `/dashboard` | JWT | Listado y creación de proyectos |
| `/project/:id` | JWT | Detalle del proyecto |

`ProtectedRoute` redirige a `/login` cuando no hay sesión. El token y el usuario se guardan en
`localStorage`; el interceptor de Axios los elimina y redirige al recibir un `401`.

## Estructura

```text
src/
├── components/   # Navbar y ProtectedRoute
├── context/      # AuthContext
├── lib/          # api.ts (Axios) y storage.ts
├── pages/        # Login, Dashboard, ProjectView
├── services/     # authService y projectService
├── types/        # Tipos de auth y proyectos
└── App.tsx
```

Credenciales demo: `demo@ideator.com` / `Demo1234!`.
