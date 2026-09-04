import React from 'react';
import { useLocation } from 'react-router-dom';

// Contenedor de tabs sin animación de espera: cambio instantáneo para navegación fluida (sobre todo en PWA/móvil)
const TabsContainer = ({ tabs, basePath, defaultTab, children, className = '' }) => {
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const last = pathSegments[pathSegments.length - 1];
  const activeTab = tabs.find(t => t.id === last)?.id || defaultTab || tabs[0]?.id;

  const activeTabContent = tabs.find(t => t.id === activeTab)?.content || children;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div key={activeTab} className="min-h-full">
          {activeTabContent}
        </div>
      </div>
    </div>
  );
};

export default TabsContainer;
