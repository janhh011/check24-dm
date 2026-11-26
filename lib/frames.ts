"use client";

/**
 * Zieht gleichmäßig verteilte Einzelbilder aus einem Video – direkt im Browser per <canvas>.
 * Im echten Produkt übernimmt das ein Worker mit ffmpeg (inkl. Szenenwechsel-Erkennung).
 */
export async function extractFrames(
  src: string,
  count = 8,
  width = 384,
  onFrame?: (dataUrl: string, index: number) => void,
): Promise<string[]> {
  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Video lädt nicht")), 15000);
    video.onloadedmetadata = () => {
      clearTimeout(t);
      resolve();
    };
    video.onerror = () => {
      clearTimeout(t);
      reject(new Error("Video konnte nicht geladen werden"));
    };
  });

  const duration = video.duration || 10;
  const height = Math.round((video.videoHeight / video.videoWidth) * width) || Math.round(width * 1.78);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  const frames: string[] = [];
  for (let i = 0; i < count; i++) {
    // zwischen 3 % und 90 % der Laufzeit – Anfang/Ende sind oft Schwarzbild oder Abspann
    const t = duration * (0.03 + (0.87 * i) / Math.max(1, count - 1));
    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("seeked", done);
        resolve();
      };
      video.addEventListener("seeked", done);
      video.currentTime = t;
      setTimeout(done, 3000); // Sicherheitsnetz
    });
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    frames.push(dataUrl);
    onFrame?.(dataUrl, i);
  }
  video.removeAttribute("src");
  video.load();
  return frames;
}
