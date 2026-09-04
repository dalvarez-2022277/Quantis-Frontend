import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Notification from './Notification';

/**
 * Muestra las notificaciones como alert iOS: solo la primera
 * como modal centrado (fondo oscurecido + tarjeta + OK).
 */
const NotificationContainer = ({ notifications, onRemove }) => {
  // Estilo iOS: un alert a la vez (el más reciente)
  const current = notifications.length > 0 ? notifications[notifications.length - 1] : null;

  return (
    <AnimatePresence mode="wait">
      {current && (
        <Notification
          key={current.id}
          {...current}
          onClose={onRemove}
        />
      )}
    </AnimatePresence>
  );
};

export default NotificationContainer;
