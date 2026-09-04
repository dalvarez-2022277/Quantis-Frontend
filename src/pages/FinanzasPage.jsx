import React from 'react';
import TabsContainer from '../components/TabsContainer';
import CuotasContent from './components/CuotasContent';
import CuentasPage from './CuentasPage';

/** Cuotas + Cuentas en una sola sección (barra inferior / menú lateral). */
const FinanzasPage = () => {
  const tabs = [
    { id: 'cuotas', label: 'Cuotas', content: <CuotasContent /> },
    { id: 'cuentas', label: 'Cuentas', content: <CuentasPage embedded /> }
  ];

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      <TabsContainer
        tabs={tabs}
        basePath="/finanzas"
        defaultTab="cuotas"
        className="flex-1 flex flex-col min-h-0"
      />
    </div>
  );
};

export default FinanzasPage;
