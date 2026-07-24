import { useEffect, useState } from 'react'
import prices from './data/prices.json'
import { useDarkMode, useLocalStorage } from './lib/hooks'
import { api } from './lib/api'
import PriceTable from './components/PriceTable'
import Manual from './components/Manual'
import Calculator from './components/Calculator'
import Cart from './components/Cart'
import Account from './components/Account'

export default function App() {
  const [tab, setTab] = useState('prices')
  const [dark, setDark] = useDarkMode()
  const [cart, setCart] = useLocalStorage('psm_cart', [])
  const [auth, setAuth] = useState(null) // null=로딩, {role,...}
  const cartQty = cart.reduce((n, it) => n + (Number(it.qty) || 1), 0)
  const addToCart = (item) => setCart((c) => [...c, item])

  const loadAuth = async () => {
    try { setAuth(await api.get('me.php')) }
    catch { setAuth({ role: 'guest' }) }
  }
  useEffect(() => { loadAuth() }, [])

  const acctLabel = auth?.role === 'admin' ? '관리자' : auth?.role === 'member' ? '내정보' : '회원'
  const acctIcon = auth?.role === 'admin' ? '🔐' : '👤'

  const TABS = [
    { id: 'prices', label: '시세표', icon: '💰' },
    { id: 'manual', label: '등급 판정', icon: '📋' },
    { id: 'calc', label: '계산기', icon: '🧮' },
    { id: 'cart', label: '출고 신청', icon: '📤' },
    { id: 'account', label: acctLabel, icon: acctIcon },
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-extrabold leading-tight sm:text-lg">📱 {prices.source} 매입 시세</h1>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              기준일 <span className="tnum font-semibold">{prices.baseDate}</span>
              <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{prices.updateNote}</span>
            </p>
            <a href={`tel:${prices.tel}`} className="mt-0.5 inline-block text-[11px] font-bold text-slate-600 dark:text-slate-300">📞 {prices.tel}</a>
          </div>
          <button onClick={() => setDark((d) => !d)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg dark:border-slate-700" aria-label="다크모드 토글">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-24 pt-4">
        {tab === 'prices' && <PriceTable />}
        {tab === 'manual' && <Manual />}
        {tab === 'calc' && <Calculator onAdd={addToCart} />}
        {tab === 'cart' && <Cart cart={cart} setCart={setCart} auth={auth} />}
        {tab === 'account' && <Account auth={auth} setAuth={setAuth} onAuthChange={loadAuth} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {TABS.map((t) => {
            const on = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ' + (on ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')}>
                <span className="relative text-xl leading-none">
                  {t.icon}
                  {t.id === 'cart' && cartQty > 0 && (
                    <span className="absolute -right-2.5 -top-1 min-w-[16px] rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-4 text-white">{cartQty}</span>
                  )}
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
