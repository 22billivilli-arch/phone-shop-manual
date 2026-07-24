import { useMemo, useState } from 'react'
import prices from '../data/prices.json'
import { manwon } from '../lib/hooks'

const BRANDS = ['전체', '애플', '삼성']

// series 등장 순서 유지
function seriesOrder() {
  const seen = []
  for (const m of prices.models) if (!seen.includes(m.series)) seen.push(m.series)
  return seen
}

// 브랜드별 표시 컬럼 (삼성만 '통' 노출)
const COLS_APPLE = [
  { key: 'A', label: 'A', cls: 'text-emerald-600 dark:text-emerald-400', bold: true },
  { key: 'Am', label: 'A-', cls: 'text-sky-600 dark:text-sky-400' },
  { key: 'Bp', label: 'B+', cls: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'used', label: '중고', cls: 'text-amber-600 dark:text-amber-400' },
  { key: 'broken', label: '액파', cls: 'text-rose-500 dark:text-rose-400' },
]
const COLS_SAMSUNG = [
  { key: 'A', label: 'A', cls: 'text-emerald-600 dark:text-emerald-400', bold: true },
  { key: 'Am', label: 'A-', cls: 'text-sky-600 dark:text-sky-400' },
  { key: 'Bp', label: 'B+', cls: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'used', label: 'B', cls: 'text-amber-600 dark:text-amber-400' },
  { key: 'tong', label: '통', cls: 'text-slate-500 dark:text-slate-400' },
  { key: 'broken', label: '액파', cls: 'text-rose-500 dark:text-rose-400' },
]

export default function PriceTable() {
  const [brand, setBrand] = useState('전체')
  const [q, setQ] = useState('')

  const groups = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const filtered = prices.models.filter(
      (m) =>
        (brand === '전체' || m.brand === brand) &&
        (!kw || (m.name + ' ' + m.cap + ' ' + (m.code || '')).toLowerCase().includes(kw)),
    )
    const order = seriesOrder()
    const map = {}
    for (const m of filtered) (map[m.series] ||= []).push(m)
    return order.filter((s) => map[s]).map((s) => ({ series: s, brand: map[s][0].brand, rows: map[s] }))
  }, [brand, q])

  const total = groups.reduce((n, g) => n + g.rows.length, 0)

  return (
    <div className="space-y-4">
      {/* 안내 배너 */}
      <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
        <b>{prices.source}</b> 매입 시세 (만원) · <b className="text-indigo-600 dark:text-indigo-300">{prices.updateNote}</b>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] opacity-90">
          <span><b className="text-emerald-600 dark:text-emerald-400">A</b>·<b className="text-sky-600 dark:text-sky-400">A-</b> 배90%↑</span>
          <span><b className="text-indigo-600 dark:text-indigo-400">B+</b> 배85%↑</span>
          <span><b className="text-amber-600 dark:text-amber-400">중고/B</b> 배무관</span>
          <span><b className="text-slate-500">통</b> 통기계</span>
          <span><b className="text-rose-500">액파</b> 액정파손</span>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={
                'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ' +
                (brand === b ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400')
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
          placeholder="🔍 모델·용량·코드 (예: 17 pro, 512, S928)"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      <p className="px-1 text-xs text-slate-500">
        {total}개 · 단위 <b>만원</b> · 상태 차감 전 <b>최대 매입가</b>
      </p>

      {groups.map((g) => {
        const cols = g.brand === '삼성' ? COLS_SAMSUNG : COLS_APPLE
        return (
          <section key={g.series}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold">
                <span className="mr-1 text-[11px] text-slate-400">{g.brand}</span>
                {g.series}
              </h2>
              <span className="text-[11px] text-slate-400">{g.rows.length}개</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    <th className="px-1.5 py-2 text-left font-semibold" style={{ width: '31%' }}>모델</th>
                    {cols.map((c) => (
                      <th key={c.key} className={'px-0.5 py-2 text-right font-bold ' + c.cls}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((m, i) => (
                    <tr
                      key={m.name + m.cap}
                      className={'border-t border-slate-100 dark:border-slate-800 ' + (i % 2 ? 'bg-slate-50/40 dark:bg-slate-800/20' : '')}
                    >
                      <td className="px-1.5 py-2">
                        <div className="truncate text-[11px] font-semibold leading-tight">{m.name}</div>
                        <div className="truncate text-[9px] leading-tight text-slate-400">{m.cap}{m.code ? ' · ' + m.code : ''}</div>
                      </td>
                      {cols.map((c) => (
                        <td
                          key={c.key}
                          className={'tnum px-0.5 py-2 text-right text-[11px] ' + c.cls + (c.bold ? ' font-bold' : '')}
                        >
                          {m[c.key] == null ? <span className="text-slate-300 dark:text-slate-700">·</span> : manwon(m[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      {total === 0 && <p className="py-10 text-center text-sm text-slate-400">검색 결과가 없어요.</p>}

      <p className="px-1 text-[11px] leading-relaxed text-slate-400">
        ※ {prices.note} 문의 {prices.tel}
      </p>
    </div>
  )
}
