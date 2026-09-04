import React from 'react';
import CalendarioContent from './components/CalendarioContent';

/** Solo agenda / vencimientos (sin cuotas ni cuentas aquí). */
const CalendarioPage = () => (
  <div className="flex flex-col flex-1 min-h-0 w-full bg-gray-50 dark:bg-gray-900">
    <CalendarioContent />
  </div>
);

export default CalendarioPage;
