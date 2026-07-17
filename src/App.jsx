import { useState } from 'react'
import prices from './data/prices.json'
import { useDarkMode } from './lib/hooks'
import PriceTable from './components/PriceTable'
import Manual from './components/Manual'
import Calculator from './components/Calculator'

const TABS = [
  { id: 'prices', label: '시세표', icon: '💰' },
  { id: 'manual', label: '등급 판정', icon: '📋' },
  { id: 'calc', label: '매입 계산기', icon: '🧮' },
]

export default function App() {
  const [tab, setTab] = useState('prices')
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-extrabold leading-tight sm:text-lg">📱 중고폰 매장 매뉴얼</h1>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              시세 기준일: <span className="tnum font-semibold">{prices.baseDate}</span>
            </p>
          </div>
          <button
            onClick={() => setDark((d) => !d)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg dark:border-slate-700"
            aria-label="다크모드 토글"
            title="다크모드 토글"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-3xl px-3 pb-24 pt-4">
        {tab === 'prices' && <PriceTable />}
        {tab === 'manual' && <Manual />}
        {tab === 'calc' && <Calculator />}
      </main>

      {/* 하단 탭바 (모바일 퍼스트) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {TABS.map((t) => {
            const on = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ' +
                  (on
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500')
                }
              >
                <span className="text-xl leading-none">{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
