/**
 * Lee los colores del tema desde las variables CSS (configuración del usuario).
 * Útil para gráficos y cualquier lógica JS que necesite los colores actuales.
 */
export function getThemeColors() {
  if (typeof document === 'undefined') {
    return {
      primary: '#2563eb',
      primaryDark: '#60a5fa',
      income: '#16a34a',
      incomeDark: '#4ade80',
      expense: '#dc2626',
      expenseDark: '#f87171',
    };
  }
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  const s = getComputedStyle(root);
  const get = (name) => s.getPropertyValue(name).trim() || undefined;
  return {
    primary: get('--q-primary') || '#2563eb',
    primaryDark: get('--q-primary-dark') || '#60a5fa',
    income: get('--q-income') || '#16a34a',
    incomeDark: get('--q-income-dark') || '#4ade80',
    expense: get('--q-expense') || '#dc2626',
    expenseDark: get('--q-expense-dark') || '#f87171',
    isDark,
    /** Color principal de ingresos (según modo claro/oscuro) */
    incomeActive: isDark ? (get('--q-income-dark') || '#4ade80') : (get('--q-income') || '#16a34a'),
    /** Color principal de gastos (según modo claro/oscuro) */
    expenseActive: isDark ? (get('--q-expense-dark') || '#f87171') : (get('--q-expense') || '#dc2626'),
    /** Color primary activo */
    primaryActive: isDark ? (get('--q-primary-dark') || '#60a5fa') : (get('--q-primary') || '#2563eb'),
  };
}
