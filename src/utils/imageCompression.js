// Utilidades para compresión de imágenes
// Optimizado para imágenes de iPhone y otros dispositivos móviles

/**
 * Comprime una imagen automáticamente
 * @param {File} file - Archivo de imagen original
 * @param {Object} options - Opciones de compresión
 * @returns {Promise<File>} - Archivo comprimido
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 800,        // Ancho máximo
    maxHeight = 800,       // Alto máximo
    quality = 0.8,         // Calidad de compresión (0.1 - 1.0)
    maxSizeKB = 500,       // Tamaño máximo en KB
    format = 'jpeg'        // Formato de salida
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad específica
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'));
              return;
            }

            // Verificar si el tamaño es aceptable
            const sizeKB = blob.size / 1024;
            
            if (sizeKB <= maxSizeKB) {
              // Crear nuevo archivo con el blob comprimido
              const compressedFile = new File(
                [blob], 
                file.name, 
                { 
                  type: `image/${format}`,
                  lastModified: Date.now()
                }
              );
              resolve(compressedFile);
            } else {
              // Si aún es muy grande, reducir más la calidad
              compressWithLowerQuality(canvas, file, maxSizeKB, format, resolve, reject);
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    // Cargar imagen
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calcula las nuevas dimensiones manteniendo la proporción
 */
const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth;
  let height = originalHeight;

  // Redimensionar si es necesario
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Comprime con calidad más baja si es necesario
 */
const compressWithLowerQuality = (canvas, originalFile, maxSizeKB, format, resolve, reject) => {
  const qualities = [0.7, 0.6, 0.5, 0.4, 0.3];
  
  const tryCompress = (index) => {
    if (index >= qualities.length) {
      reject(new Error('No se pudo comprimir la imagen al tamaño deseado'));
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Error al comprimir la imagen'));
          return;
        }

        const sizeKB = blob.size / 1024;
        
        if (sizeKB <= maxSizeKB) {
          const compressedFile = new File(
            [blob], 
            originalFile.name, 
            { 
              type: `image/${format}`,
              lastModified: Date.now()
            }
          );
          resolve(compressedFile);
        } else {
          tryCompress(index + 1);
        }
      },
      `image/${format}`,
      qualities[index]
    );
  };

  tryCompress(0);
};

/**
 * Valida si una imagen necesita compresión
 * @param {File} file - Archivo de imagen
 * @returns {Object} - Información sobre la imagen
 */
export const validateImage = (file) => {
  const maxSizeMB = 2; // 2MB máximo recomendado
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const sizeMB = file.size / (1024 * 1024);
  const needsCompression = file.size > maxSizeBytes;
  
  return {
    sizeMB: Math.round(sizeMB * 100) / 100,
    needsCompression,
    isTooLarge: file.size > maxSizeBytes * 2, // Más de 4MB es demasiado grande
    originalSize: file.size
  };
};

/**
 * Comprime imagen específicamente para avatares de perfil
 * @param {File} file - Archivo de imagen
 * @returns {Promise<File>} - Archivo comprimido optimizado para avatar
 */
export const compressForAvatar = async (file) => {
  return compressImage(file, {
    maxWidth: 400,        // Avatar más pequeño
    maxHeight: 400,
    quality: 0.85,         // Buena calidad para avatar
    maxSizeKB: 200,        // Máximo 200KB para avatar
    format: 'jpeg'
  });
};

/**
 * Obtiene información detallada de una imagen
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} - Información de la imagen
 */
export const getImageInfo = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        sizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
        type: file.type,
        name: file.name
      });
    };
    
    img.onerror = () => {
      reject(new Error('No se pudo leer la información de la imagen'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};
