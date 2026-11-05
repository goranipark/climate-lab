// 사진 줄이기: 긴 변을 정해진 크기로 줄이고 JPEG data URL로 바꾼다 (localStorage 용량 절약)
import { config } from '../types/data';

export async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const max = config.storage.photoMaxSide;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', config.storage.photoJpegQuality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
