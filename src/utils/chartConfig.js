/**
 * Configuraciones y temas para ECharts
 * Usa los colores del tema (Configuración) vía getThemeColors().
 */

import { getThemeColors } from './themeColors';

/** Colores para gráficos según tema actual (ingresos = success, gastos = danger, primary = info). */
export const getChartColors = () => {
  const t = getThemeColors();
  return {
    primary: t.primaryActive,
    secondary: t.expenseActive,
    tertiary: t.primaryActive,
    quaternary: '#f59e0b',
    success: t.incomeActive,
    danger: t.expenseActive,
    warning: '#f59e0b',
    info: t.primaryActive,
    income: t.incomeActive,
    expense: t.expenseActive,
  };
};

/** @deprecated Usar getChartColors() para respetar tema del usuario */
export const chartColors = {
  get primary() { return getChartColors().primary; },
  get secondary() { return getChartColors().secondary; },
  get tertiary() { return getChartColors().tertiary; },
  get quaternary() { return getChartColors().quaternary; },
  get success() { return getChartColors().success; },
  get danger() { return getChartColors().danger; },
  get warning() { return getChartColors().warning; },
  get info() { return getChartColors().info; },
};

// ─── Gráficas: gastos = expense tema, ingresos = income tema ───────────────────────────────

const buildPaletteFromBase = (base, count) => {
  const variants = [
    lightenHex(base, 0.55),
    lightenHex(base, 0.4),
    lightenHex(base, 0.25),
    lightenHex(base, 0.12),
    base,
    darkenHex(base, 0.08),
    darkenHex(base, 0.18),
    darkenHex(base, 0.28),
  ];
  const colors = [];
  for (let i = 0; i < count; i++) colors.push(variants[i % variants.length]);
  return colors;
};

/** Genera paleta de tonos para gastos a partir del color de tema. */
export const getGastosCategoriaColors = (isDark = false, count = 8) => {
  const t = getThemeColors();
  const base = isDark ? t.expenseDark : t.expense;
  return buildPaletteFromBase(base, count);
};

/** Genera paleta de tonos para ingresos a partir del color de tema. */
export const getIngresosCategoriaColors = (isDark = false, count = 8) => {
  const t = getThemeColors();
  const base = isDark ? t.incomeDark : t.income;
  return buildPaletteFromBase(base, count);
};

/** Aclara un color hex (acercándolo al blanco). amount 0–1 */
export const lightenHex = (hex, amount = 0.35) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(Math.min(255, ((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * amount));
  const g = Math.round(Math.min(255, ((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * amount));
  const b = Math.round(Math.min(255, (n & 0xff) + (255 - (n & 0xff)) * amount));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

/** Oscurece un color hex. amount 0–1 */
export const darkenHex = (hex, amount = 0.2) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(Math.max(0, ((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.round(Math.max(0, ((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.round(Math.max(0, (n & 0xff) * (1 - amount)));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

/** Gradiente radial para pie/donut: centro más claro → borde más intenso (suave). */
export const gradientRadialForPie = (baseHex, lightenAmount = 0.5) => ({
  type: 'radial',
  x: 0.5,
  y: 0.5,
  r: 0.65,
  colorStops: [
    { offset: 0, color: lightenHex(baseHex, lightenAmount) },
    { offset: 0.7, color: baseHex },
    { offset: 1, color: darkenHex(baseHex, 0.08) }
  ]
});

/** Gradiente lineal para barras: arriba más claro → abajo más intenso (suave). */
export const gradientLinearForBar = (baseHex, lightenAmount = 0.45) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: lightenHex(baseHex, lightenAmount) },
    { offset: 0.5, color: baseHex },
    { offset: 1, color: darkenHex(baseHex, 0.06) }
  ]
});

// Tema dark para ECharts
export const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#e5e7eb',
    fontWeight: 'normal'
  },
  title: {
    textStyle: {
      color: '#f9fafb',
      fontWeight: 'normal'
    },
    subtextStyle: {
      color: '#d1d5db',
      fontWeight: 'normal'
    }
  },
  legend: {
    textStyle: {
      color: '#e5e7eb',
      fontWeight: 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderColor: '#374151',
    textStyle: {
      color: '#f9fafb'
    }
  },
  grid: {
    borderColor: '#374151'
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#4b5563'
      }
    },
    axisTick: {
      lineStyle: {
        color: '#4b5563'
      }
    },
    axisLabel: {
      color: '#9ca3af',
      fontWeight: 'normal'
    },
    splitLine: {
      lineStyle: {
        color: '#374151'
      }
    }
  },
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: '#4b5563'
      }
    },
    axisTick: {
      lineStyle: {
        color: '#4b5563'
      }
    },
    axisLabel: {
      color: '#9ca3af',
      fontWeight: 'normal'
    },
    splitLine: {
      lineStyle: {
        color: '#374151'
      }
    }
  }
};

// Tema light para ECharts
export const lightTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#111827'
  },
  title: {
    textStyle: {
      color: '#111827'
    },
    subtextStyle: {
      color: '#6b7280'
    }
  },
  legend: {
    textStyle: {
      color: '#374151'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e5e7eb',
    textStyle: {
      color: '#111827'
    }
  },
  grid: {
    borderColor: '#e5e7eb'
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#d1d5db'
      }
    },
    axisTick: {
      lineStyle: {
        color: '#d1d5db'
      }
    },
    axisLabel: {
      color: '#6b7280'
    },
    splitLine: {
      lineStyle: {
        color: '#f3f4f6'
      }
    }
  },
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: '#d1d5db'
      }
    },
    axisTick: {
      lineStyle: {
        color: '#d1d5db'
      }
    },
    axisLabel: {
      color: '#6b7280'
    },
    splitLine: {
      lineStyle: {
        color: '#f3f4f6'
      }
    }
  }
};

/**
 * Obtener tema según modo dark/light
 */
export const getChartTheme = (isDark) => {
  return isDark ? darkTheme : lightTheme;
};

/**
 * Configuración base para gráficos de línea
 */
export const getLineChartOption = (isDark = false) => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  ...getChartTheme(isDark)
});

/**
 * Configuración base para gráficos de barras
 */
export const getBarChartOption = (isDark = false) => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  ...getChartTheme(isDark)
});

/**
 * Configuración base para gráficos de pie
 */
export const getPieChartOption = (isDark = false) => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  ...getChartTheme(isDark)
});

/**
 * Configuración base para gráficos de área
 */
export const getAreaChartOption = (isDark = false) => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  ...getChartTheme(isDark)
});
