// 백엔드 API 클라이언트 (같은 도메인 /api/*.php, 세션 쿠키)
const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(BASE + '/' + path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  let data = {}
  try { data = await res.json() } catch { /* noop */ }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `요청 실패 (${res.status})`)
  }
  return data
}

export const api = {
  get: (path) => req(path),
  post: (path, body) => req(path, { method: 'POST', body: JSON.stringify(body || {}) }),
}

// 파일 → 리사이즈 후 dataURL (업로드 용량 절감: 최대 1400px, jpeg 0.7)
export function fileToDataURL(file, max = 1400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')) }
    img.src = url
  })
}
