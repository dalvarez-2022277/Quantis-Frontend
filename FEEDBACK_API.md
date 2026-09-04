# Contrato API — Feedback (frontend Quantis)

Base: `VITE_API_URL` (por defecto `{VITE_BACKEND_URL}/api`).

## Autenticación

Todas las rutas requieren `Authorization: Bearer <token>`.

## Perfil / roles

`GET /auth/profile` debe devolver el usuario con al menos uno de:

- `user.role: "super_admin"` (o `"admin"`), o
- `user.roles: ["super_admin", ...]`, o
- `user.permissions` incluye `feedback:read`, `feedback:manage` o `admin:*`

El frontend usa [`src/utils/authPermissions.js`](src/utils/authPermissions.js) para `isSuperAdmin(user)`.

## Usuario — enviar feedback

`POST /feedback`

**Body (JSON):**

```json
{
  "type": "bug | suggestion | other",
  "title": "string",
  "message": "string",
  "meta": {
    "path": "/dashboard",
    "userAgent": "...",
    "appVersion": "web"
  }
}
```

**Respuesta:** 201 o 200 con cuerpo opcional `{ "ok": true }` o el registro creado.

## Admin — listar feedback

`GET /admin/feedback`

**Query (opcional):** `status`, `type`, `q`, `page`, `limit`

**Respuesta:** una de:

- `{ "items": [ ... ], "total": number }`
- `{ "data": [ ... ], "total": number }`
- `[ ... ]` (array directo)

Cada ítem debería incluir al menos: `id` (o `_id`), `type`, `title`, `message`, `status`, `createdAt` (o `created_at`), y opcionalmente `user`, `adminNote`.

## Admin — actualizar feedback

`PATCH /admin/feedback/:id`

**Body (JSON):**

```json
{
  "status": "new | in_progress | resolved",
  "adminNote": "string"
}
```

**Errores:** 403 si el usuario no es admin; 404 si no existe el id.
