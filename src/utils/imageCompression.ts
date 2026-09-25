export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const JPEG_QUALITY = 0.7;

export function compressImage(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        let width = image.width;
        let height = image.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(
            MAX_WIDTH / width,
            MAX_HEIGHT / height
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('No se pudo crear el canvas.'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(
          'image/jpeg',
          JPEG_QUALITY
        );

        const base64 = dataUrl.split(',')[1] ?? '';

        const compressedSize = Math.round(
          (base64.length * 3) / 4
        );

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize,
        });
      };

      image.onerror = () => {
        reject(new Error('No se pudo procesar la imagen.'));
      };

      image.src = reader.result as string;
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer la imagen.'));
    };

    reader.readAsDataURL(file);
  });
}