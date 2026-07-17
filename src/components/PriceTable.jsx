import { useMemo, useState } from 'react'
import prices from '../data/prices.json'
import { useRates, won } from '../lib/hooks'
import RateSettings from './RateSettings'

const BRANDS = ['전체', '애플', '삼성']

export default function PriceTable() {
  const [rates] = useRates()
  const [brand, setBrand] = useState('전체')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return prices.models.filter(
      (m) =>
        (brand === '전체' || m.brand === brand) &&
        (!kw || m.model.toLowerCase().includes(kw)),
    )
  }, [brand, q])

  return (
    <div className="space-y-4">
      <RateSettings />

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={
                'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ' +
                (brand === b
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 dark:text-slate-400')
              }
            >
              {b}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="🔍 모델명 검색"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      <p className="px-1 text-xs text-slate-500">
        {rows.length}개 · 판매시세는 <b>S급·기본 용량</b> 기준 · 단위 원
      </p>

      {/* 시세 테이블 (모바일: 가로 스크롤) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left font-semibold dark:bg-slate-800/70">
                모델명
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">판매(S)</th>
              <th className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">매입 S</th>
              <th className="px-3 py-2.5 text-right font-semibold text-sky-600 dark:text-sky-400">A</th>
              <th className="px-3 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">B</th>
              <th className="px-3 py-2.5 text-right font-semibold">예상마진</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => {
              const buyS = Math.round(m.price * rates.S)
              const buyA = Math.round(m.price * rates.A)
              const buyB = Math.round(m.price * rates.B)
              const margin = m.price - buyS
              return (
                <tr
                  key={m.brand + m.model}
                  className={
                    'border-t border-slate-100 dark:border-slate-800 ' +
                    (i % 2 ? 'bg-slate-50/40 dark:bg-slate-800/20' : '')
                  }
                >
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5">
                    <div className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                      {m.model}
                      {m.estimated && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          추정
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{m.brand}</div>
                  </td>
                  <td className="tnum px-3 py-2.5 text-right font-semibold">{won(m.price)}</td>
                  <td className="tnum px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{won(buyS)}</td>
                  <td className="tnum px-3 py-2.5 text-right text-sky-600 dark:text-sky-400">{won(buyA)}</td>
                  <td className="tnum px-3 py-2.5 text-right text-amber-600 dark:text-amber-400">{won(buyB)}</td>
                  <td className="tnum px-3 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">{won(margin)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">
                  검색 결과가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-[11px] text-slate-400">
        ※ 매입시세는 <b>판매시세 × 매입배율</b>로 실시간 계산됩니다. 예상마진 = 판매시세 − 매입 S급.
      </p>
    </div>
  )
}
