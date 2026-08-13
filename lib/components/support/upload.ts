export interface UploadFile { filename: string; mimeType: string; sizeBytes: number; data: string }

export function readFiles(files: FileList | File[]): Promise<UploadFile[]> {
  return Promise.all(Array.from(files).map((f) => new Promise<UploadFile>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      const b64 = s.slice(s.indexOf(",") + 1);
      resolve({ filename: f.name, mimeType: f.type || "application/octet-stream", sizeBytes: f.size, data: b64 });
    };
    r.onerror = reject;
    r.readAsDataURL(f);
  })));
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
