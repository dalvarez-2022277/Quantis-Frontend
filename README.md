# Quantis Frontend
Gestor de finanzas personal y presupuestos

## Configuración para Render

### Variables de Entorno
Configura estas variables en Render:

```
VITE_API_URL=https://quantis-backend.onrender.com/api
```

### Configuración de Build
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18.x o superior

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

### Desarrollo Local
```bash
npm install
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:5173`
