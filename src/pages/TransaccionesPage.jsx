import React from 'react';
import TabsContainer from '../components/TabsContainer';
import IngresosContent from './components/IngresosContent';
import GastosContent from './components/GastosContent';
import { CurrencyDollarIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const TransaccionesPage = () => {
  const tabs = [
    { id: 'ingresos', label: 'Ingresos', icon: CurrencyDollarIcon, content: <IngresosContent /> },
    { id: 'gastos', label: 'Gastos', icon: ArrowTrendingDownIcon, content: <GastosContent /> }
  ];

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      <TabsContainer
        tabs={tabs}
        basePath="/transacciones"
        defaultTab="ingresos"
        className="flex-1 flex flex-col min-h-0"
      />
    </div>
  );
};

export default TransaccionesPage;
