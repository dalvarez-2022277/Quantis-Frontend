import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const TRANSACCIONES_ITEMS = [
  { id: 'ingresos', label: 'Ingresos', path: '/transacciones/ingresos', accent: 'income' },
  { id: 'gastos', label: 'Gastos', path: '/transacciones/gastos', accent: 'expense' }
]

const FINANZAS_ITEMS = [
  { id: 'cuotas', label: 'Cuotas', path: '/finanzas/cuotas', accent: 'expense' },
  { id: 'cuentas', label: 'Cuentas', path: '/finanzas/cuentas', accent: 'primary' }
]

/** Color activo de la pestaña = tema ingreso / gasto / primario (cuentas) */
const accentActiveClasses = {
  income: { text: 'text-q-income', bar: 'bg-q-income' },
  expense: { text: 'text-q-expense', bar: 'bg-q-expense' },
  primary: { text: 'text-q-primary', bar: 'bg-q-primary' }
}

/** Items de la barra de sección según la ruta */
export const getSectionNavItems = (path) => {
  if (path.startsWith('/transacciones')) return TRANSACCIONES_ITEMS
  if (path.startsWith('/finanzas')) return FINANZAS_ITEMS
  return []
}

const SECTION_NAV_HEIGHT = 48

const HeaderTwoRows = ({ sidebarCollapsed = true, topOffset }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const items = getSectionNavItems(location.pathname)

  // Coincidencia exacta (evita que /calendario marque activas todas las subrutas)
  const isActive = (p) => {
    const path = (location.pathname.replace(/\/$/, '') || '/')
    const target = (p.replace(/\/$/, '') || '/')
    return path === target
  }

  if (!items.length) return null

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`fixed left-0 right-0 z-[49] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-visible ${sidebarCollapsed ? 'lg:left-16' : 'lg:left-72'}`}
      style={{
        top: topOffset != null ? `${topOffset}px` : 'var(--header-height)',
        height: `${SECTION_NAV_HEIGHT}px`,
        minHeight: `${SECTION_NAV_HEIGHT}px`,
      }}
    >
      <nav
        className="flex items-stretch justify-center gap-6 sm:gap-8 h-full px-4 sm:px-6 w-full max-w-6xl mx-auto overflow-visible"
        aria-label="Sección"
      >
        {items.map((it) => {
          const active = isActive(it.path)
          const accent = accentActiveClasses[it.accent] || accentActiveClasses.primary
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => navigate(it.path, { replace: true })}
              className={`
                flex flex-col items-center justify-center py-2 px-4 min-w-0
                h-full min-h-0 overflow-visible bg-transparent
                transition-colors duration-200 touch-manipulation
                focus:outline-none focus-visible:outline-none
                ${active
                  ? accent.text
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={it.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-sm font-medium leading-normal whitespace-nowrap overflow-visible">
                {it.label}
              </span>
              {active && (
                <span
                  className={`mt-1.5 w-full min-w-[1rem] h-0.5 rounded-full shrink-0 ${accent.bar}`}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </nav>
    </motion.div>
  )
}

export default HeaderTwoRows
