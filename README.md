# Quantis Frontend

Gestor de finanzas personal y presupuestos.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- ECharts (gráficos)

## Requisitos

- Node.js 18 o superior
- La API de [`Quantis-Backend`](../Quantis-Backend) corriendo (local o accesible por red)

## Configuración

Crea un archivo `.env` en la raíz con las variables que necesite tu entorno:

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API (ej. `http://localhost:5000/api`) |
| `VITE_BACKEND_URL` | URL del backend tal como la ve el navegador (usada en build de Docker) |
| `VITE_APP_VERSION` | Versión mostrada en la app (opcional, por defecto toma la de `package.json`) |
| `VITE_PASSWORD_SALT` | Salt usado para hashing en cliente (opcional) |

## Desarrollo local

```bash
npm install
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview
```

## Con Docker

```bash
docker compose up -d --build
```

Levanta el frontend compilado y servido con nginx en el puerto `8080` (configurable con `WEB_PORT`). Requiere que la API (`Quantis-Backend`) esté accesible en la URL indicada por `VITE_BACKEND_URL`.

## Funcionalidades principales

- Autenticación con email/contraseña y Google OAuth, recuperación de contraseña
- Dashboard con resumen financiero y gráficos
- Gestión de cuentas, ingresos y gastos
- Transacciones recurrentes, cuotas y préstamos
- Calendario financiero
- Gestión de tarjetas
- Perfil y ajustes de usuario
- Panel de administración de feedback (`/admin/feedback`, ver [`FEEDBACK_API.md`](./FEEDBACK_API.md))
- Soporte PWA (agregar a pantalla de inicio)

### Archivos de Configuración SPA
- `public/_redirects`: Configuración para manejar rutas SPA (Netlify/Render)
- `public/.htaccess`: Configuración para Apache
- `render.yaml`: Configuración específica para Render

### Rutas Disponibles
- `/` - Dashboard (requiere autenticación)
- `/login` - Iniciar sesión
- `/register` - Registrarse
- `/forgot-password` - Recuperar contraseña
- `/reset-password` - Restablecer contraseña
- `/profile` - Perfil de usuario
- `/ajustes` - Configuración de usuario
