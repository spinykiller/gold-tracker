export async function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    img.src = url;
  });
}

export async function createThumbnail(file, size = 200) {
  return compressImage(file, size, 0.6);
}

export function blobToUrl(blob) {
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export function blobToBase64(data) {
  return new Promise((resolve, reject) => {
    let blob = data;
    if (data instanceof ArrayBuffer) {
      blob = new Blob([data]);
    } else if (ArrayBuffer.isView(data)) {
      blob = new Blob([data.buffer]);
    }
    if (!(blob instanceof Blob)) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const mime = parts[0].split(':')[1];
  const raw = atob(parts[1]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
