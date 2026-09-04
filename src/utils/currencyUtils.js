/**
 * Utilidades para manejo de monedas y montos
 */

/**
 * Formatear monto según la moneda
 * @param {number} amount - Monto a formatear
 * @param {string} currency - Código de moneda ('GTQ' o 'USD')
 * @returns {string} Monto formateado
 */
export const formatCurrency = (amount, currency = 'GTQ') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'GTQ' ? 'Q0.00' : '$0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (currency === 'GTQ') {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  } else if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  }

  return numAmount.toString();
};

/**
 * Formatear monto sin símbolo de moneda
 * @param {number} amount - Monto a formatear
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {string} Monto formateado sin símbolo
 */
export const formatAmount = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toFixed(decimals);
};

/**
 * Obtener símbolo de moneda
 * @param {string} currency - Código de moneda
 * @returns {string} Símbolo de moneda
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    'GTQ': 'Q',
    'USD': '$'
  };
  return symbols[currency] || currency;
};

/**
 * Formatear monto con símbolo personalizado
 * @param {number} amount - Monto a formatear
 * @param {string} symbol - Símbolo a usar
 * @returns {string} Monto formateado
 */
export const formatWithSymbol = (amount, symbol = 'Q') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`;
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${numAmount.toFixed(2)}`;
};

/**
 * Formatear monto para mostrar en tarjetas (compacto)
 * @param {number} amount - Monto a formatear
 * @param {string} currency - Código de moneda
 * @returns {string} Monto formateado compacto
 */
export const formatCurrencyCompact = (amount, currency = 'GTQ') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'GTQ' ? 'Q0' : '$0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = getCurrencySymbol(currency);

  if (Math.abs(numAmount) >= 1000000) {
    return `${symbol}${(numAmount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(numAmount) >= 1000) {
    return `${symbol}${(numAmount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(numAmount, currency);
};

/**
 * Limpiar formato de monto (remover símbolos y espacios)
 * @param {string} formattedAmount - Monto formateado
 * @returns {number} Monto numérico
 */
export const parseAmount = (formattedAmount) => {
  if (!formattedAmount) return 0;
  
  // Remover símbolos de moneda y espacios
  const cleaned = formattedAmount.toString().replace(/[Q$\s,]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calcular porcentaje
 * @param {number} part - Parte
 * @param {number} total - Total
 * @returns {number} Porcentaje (0-100)
 */
export const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Formatear porcentaje
 * @param {number} percentage - Porcentaje (0-100)
 * @param {number} decimals - Decimales (default: 1)
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (percentage, decimals = 1) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0%';
  }
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Calcular diferencia entre dos montos
 * @param {number} amount1 - Primer monto
 * @param {number} amount2 - Segundo monto
 * @returns {Object} { diferencia, porcentaje, esPositivo }
 */
export const calculateDifference = (amount1, amount2) => {
  const diferencia = amount1 - amount2;
  const porcentaje = amount2 !== 0 ? calculatePercentage(Math.abs(diferencia), Math.abs(amount2)) : 0;
  
  return {
    diferencia,
    porcentaje,
    esPositivo: diferencia >= 0
  };
};
