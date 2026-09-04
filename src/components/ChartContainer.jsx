import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../contexts/ThemeContext';
import { getChartTheme } from '../utils/chartConfig';
import LoadingSpinner from './LoadingSpinner';

/**
 * Componente wrapper para gráficos ECharts
 * Maneja loading, errores, responsive y temas
 * Ref opcional: expone downloadAsImage({ type, name, backgroundColor }) para descargar el gráfico
 *
 * @param {Object} option - Opciones de configuración de ECharts
 * @param {string} title - Título del gráfico
 * @param {React.ReactNode} headerAction - Acción opcional a la derecha del título (ej. menú de configuración)
 * @param {boolean} loading - Estado de carga
 * @param {string} error - Mensaje de error
 * @param {string} height - Altura del gráfico (default: '400px')
 * @param {boolean} responsive - Hacer el gráfico responsive (default: true)
 * @param {Object} style - Estilos adicionales
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} compact - Si true, usa solo height (sin aspect-ratio) para no dejar espacio vacío
 */
const ChartContainer = forwardRef(({
  option,
  title,
  headerAction = null,
  loading = false,
  error = null,
  height = '400px',
  responsive = true,
  style = {},
  className = '',
  compact = false,
  emptyMessage = 'No hay datos para mostrar'
}, ref) => {
  const { darkMode } = useTheme();
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    downloadAsImage: (opts = {}) => {
      const instance = chartRef.current?.getEchartsInstance?.();
      if (!instance) return;
      const type = opts.type || 'jpeg';
      const name = opts.name || 'chart';
      const backgroundColor = opts.backgroundColor || 'transparent';
      const url = instance.getDataURL({ type, pixelRatio: 2, backgroundColor });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.${type === 'jpeg' || type === 'jpg' ? 'jpg' : 'png'}`;
      a.click();
    }
  }), []);

  // Aplicar tema al gráfico
  const chartOption = useMemo(() => {
    if (!option) return null;
    
    const theme = getChartTheme(darkMode);
    return {
      ...option,
      ...theme,
      // Asegurar que el título tenga el tema aplicado
      title: option.title ? {
        ...option.title,
        textStyle: {
          ...theme.title?.textStyle,
          ...option.title.textStyle
        }
      } : undefined
    };
  }, [option, darkMode]);

  // Estilos: compact = altura fija sin espacio vacío; si no, aspect-ratio para escalar
  const wrapperStyle = useMemo(() => ({
    width: '100%',
    ...(compact
      ? { height, minHeight: height }
      : { minHeight: height, aspectRatio: '16 / 10' }
    ),
    ...(responsive && { maxWidth: '100%' }),
    ...style
  }), [height, responsive, style, compact]);

  const chartStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
    minHeight: height
  }), [height]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: '300px', ...style }}>
        <LoadingSpinner compact message="Cargando gráfico…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center ${className}`}>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!chartOption) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center ${className}`}
        style={{ minHeight: compact ? height : '200px', ...style }}
      >
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible relative ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-2 mb-4 w-full">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white min-w-0 flex-1">
            {title}
          </h3>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      {headerAction && !title && (
        <div className="absolute right-2 top-2 z-10">
          {headerAction}
        </div>
      )}
      <div style={wrapperStyle} className={`overflow-visible ${headerAction && !title ? (compact ? 'pt-1' : 'pt-9') : ''}`}>
        <ReactECharts
          ref={chartRef}
          option={chartOption}
          style={chartStyle}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={false}
        />
      </div>
    </div>
  );
});

ChartContainer.displayName = 'ChartContainer';

export default ChartContainer;
