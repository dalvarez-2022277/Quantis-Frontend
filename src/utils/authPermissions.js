/**
 * Roles y permisos desde el objeto `user` devuelto por el backend (GET /auth/profile).
 * Soporta: `user.role`, `user.roles[]`, `user.permissions[]`.
 */

/** @param {Record<string, unknown> | null | undefined} user */
export function normalizeRoles(user) {
  if (!user) return [];
  if (Array.isArray(user.roles)) return user.roles.map(String);
  if (user.role != null) return [String(user.role)];
  return [];
}

/** @param {Record<string, unknown> | null | undefined} user */
export function normalizePermissions(user) {
  if (!user) return [];
  if (Array.isArray(user.permissions)) return user.permissions.map(String);
  return [];
}

/** Super admin: acceso a panel de feedback y rutas /admin/* */
/** @param {Record<string, unknown> | null | undefined} user */
export function isSuperAdmin(user) {
  const roles = normalizeRoles(user);
  if (
    roles.some(
      (r) =>
        r === 'super_admin' ||
        r === 'admin' ||
        r === 'SUPER_ADMIN'
    )
  )
    return true;
  const perms = normalizePermissions(user);
  if (perms.includes('admin:*')) return true;
  if (perms.includes('feedback:read') || perms.includes('feedback:manage')) return true;
  return false;
}

/** @param {Record<string, unknown> | null | undefined} user */
/** @param {string} permission */
export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  if (isSuperAdmin(user)) return true;
  const perms = normalizePermissions(user);
  if (perms.includes('admin:*')) return true;
  return perms.includes(permission);
}
