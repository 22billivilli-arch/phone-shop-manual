import { useState, useEffect } from 'react'

// ── localStorage 동기화 상태 훅 (새로고침 시 유지) ──
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* 저장 실패 무시 */
    }
  }, [key, value])
  return [value, setValue]
}

// ── 다크모드 — 시스템 설정 따름 + 수동 토글, localStorage 저장 ──
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('psm_theme')
      if (saved === 'dark') return true
      if (saved === 'light') return false
    } catch {
      /* noop */
    }
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('psm_theme', dark ? 'dark' : 'light')
    } catch {
      /* noop */
    }
  }, [dark])
  return [dark, setDark]
}

// ── 유틸 ──
export const won = (n) => Math.round(n || 0).toLocaleString('ko-KR')
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// 만원 표기: 정수면 그대로, 소수면 1자리 (예: 208 → "208", 8.5 → "8.5")
export const manwon = (n) => {
  if (n == null || n === '') return '-'
  return Number.isInteger(n) ? n.toLocaleString('ko-KR') : String(n)
}
