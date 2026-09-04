// Hook personalizado para persistencia de estado
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar persistencia de estado en localStorage
 * @param {string} key - Clave para almacenar en localStorage
 * @param {any} defaultValue - Valor por defecto
 * @param {object} options - Opciones de configuración
 * @returns {[any, function, function]} - [valor, setter, clear]
 */
export const usePersistedState = (key, defaultValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    storage = localStorage,
    syncAcrossTabs = true
  } = options;

  // Función para obtener el valor inicial
  const getInitialValue = useCallback(() => {
    try {
      const item = storage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize, storage]);

  const [state, setState] = useState(getInitialValue);

  // Función para actualizar el estado y persistirlo.
  // Usa setState(prev => ...) para que las actualizaciones funcionales reciban siempre el estado más reciente (evita desincronización al añadir/eliminar).
  const setPersistedState = useCallback((newState) => {
    setState((prev) => {
      const valueToStore = typeof newState === 'function' ? newState(prev) : newState;
      try {
        if (valueToStore === null || valueToStore === undefined) {
          storage.removeItem(key);
        } else {
          storage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
      return valueToStore;
    });
  }, [key, serialize, storage]);

  // Función para limpiar el estado persistido
  const clearPersistedState = useCallback(() => {
    try {
      setState(defaultValue);
      storage.removeItem(key);
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue, storage]);

  // Sincronizar cambios entre pestañas
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error deserializing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, syncAcrossTabs]);

  return [state, setPersistedState, clearPersistedState];
};

/**
 * Hook para manejar formularios con persistencia
 * @param {string} formKey - Clave para almacenar el formulario
 * @param {object} initialValues - Valores iniciales del formulario
 * @returns {object} - Objeto con valores, setters y funciones de utilidad
 */
export const usePersistedForm = (formKey, initialValues = {}) => {
  const [formData, setFormData, clearFormData] = usePersistedState(formKey, initialValues);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFormData]);

  const updateFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }));
  }, [setFormData]);

  const resetForm = useCallback(() => {
    clearFormData();
  }, [clearFormData]);

  return {
    formData,
    updateField,
    updateFields,
    resetForm,
    setFormData
  };
};

/**
 * Hook para manejar listas con persistencia
 * @param {string} listKey - Clave para almacenar la lista
 * @param {array} initialList - Lista inicial
 * @returns {object} - Objeto con lista y funciones de manipulación
 */
export const usePersistedList = (listKey, initialList = []) => {
  const [list, setList, clearList] = usePersistedState(listKey, initialList);

  const addItem = useCallback((item) => {
    setList(prev => [...prev, item]);
  }, [setList]);

  const removeItem = useCallback((index) => {
    setList(prev => prev.filter((_, i) => i !== index));
  }, [setList]);

  const updateItem = useCallback((index, updatedItem) => {
    setList(prev => prev.map((item, i) => i === index ? updatedItem : item));
  }, [setList]);

  const clearAll = useCallback(() => {
    clearList();
  }, [clearList]);

  return {
    list,
    addItem,
    removeItem,
    updateItem,
    clearAll,
    setList
  };
};
