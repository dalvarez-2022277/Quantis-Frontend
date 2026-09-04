/* global __APP_VERSION__ */
/**
 * Metadatos legales y de producto (edita titular y créditos aquí).
 * La versión se inyecta en build desde package.json (vite.config.js).
 */
export const APP_NAME = 'Quantis'

/** Titular del copyright (persona física, empresa o marca registrada). */
export const COPYRIGHT_OWNER = 'Quantis'

/** Nombre del desarrollador principal (se muestra en Acerca de). */
export const DEVELOPER_NAME = 'Diego Alvarez'

/** Texto complementario bajo el nombre (opcional). */
export const DEVELOPER_ATTRIBUTION =
  'Desarrollo y diseño de la aplicación Quantis.'

// Sustituido en tiempo de compilación por Vite
export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

export function getCopyrightLine(year = new Date().getFullYear()) {
  return `© ${year} ${COPYRIGHT_OWNER}. Todos los derechos reservados.`
}
