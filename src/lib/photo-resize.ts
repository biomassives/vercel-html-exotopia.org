const MAX_PX   = 1280
const QUALITY  = 0.78

// The canvas round-trip below (drawImage → toDataURL) strips ALL EXIF
// metadata as a side effect — a canvas pixel buffer has no metadata
// channel, so re-encoding through it discards camera serial numbers,
// embedded GPS tags, and capture timestamps before the image ever reaches
// storage. This is relied upon, not incidental — see
// RISK_REDUCTION_RECOMMENDATIONS.md / legal-safe1.txt's EXIF-stripping
// recommendation for field-evidence photos. Every field-evidence upload
// path (useMonitoringWizard.ts) must go through this function, not a raw
// File/Blob upload, or metadata leaks through.
export async function resizePhoto(source: File | Blob | string): Promise<string> {
  const img = await loadImage(source)
  const { w, h } = scaledDims(img.naturalWidth, img.naturalHeight, MAX_PX)
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

export function estimateBase64Kb(dataUri: string): number {
  const b64 = dataUri.split(',')[1] ?? ''
  return Math.round((b64.length * 3) / 4 / 1024)
}

function scaledDims(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { w, h }
  const ratio = Math.min(max / w, max / h)
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) }
}

function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = reject
    if (typeof source === 'string') {
      img.onload = () => resolve(img)
      img.src = source
    } else {
      const url = URL.createObjectURL(source)
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.src = url
    }
  })
}
