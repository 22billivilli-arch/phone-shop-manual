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
  { key: 'A', label: 'A급', sub: '배90%↑', cls: 'text-emerald-600 dark:text-emerald-400', bold: true },
  { key: 'Am', label: 'A-', sub: '배90%↑', cls: 'text-sky-600 dark:text-sky-400' },
  { key: 'Bp', label: 'B+', sub: '배85%↑', cls: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'used', label: '중고', sub: '배무관', cls: 'text-amber-600 dark:text-amber-400' },
  { key: 'broken', label: '액파', sub: '액정파손', cls: 'text-rose-500 dark:text-rose-400' },
]
const COLS_SAMSUNG = [
  { key: 'A', label: 'A급', sub: '배90%↑', cls: 'text-emerald-600 dark:text-emerald-400', bold: true },
  { key: 'Am', label: 'A-', sub: '배90%↑', cls: 'text-sky-600 dark:text-sky-400' },
  { key: 'Bp', label: 'B+', sub: '배85%↑', cls: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'used', label: 'B/유리', sub: '배무관', cls: 'text-amber-600 dark:text-amber-400' },
  { key: 'tong', label: '통', sub: '통기계', cls: 'text-slate-500 dark:text-slate-400' },
  { key: 'broken', label: '액파', sub: '액정파손', cls: 'text-rose-500 dark:text-rose-400' },
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
      <div className="flex gap-2 rounded-2xl border border-indigo-300 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
        <span>💡</span>
        <p>
          <b>{prices.source}</b> 매입 시세표 · 단위 <b>만원</b>. 등급 <b>A/A- 배90%↑ · B+ 배85%↑ · 중고 배무관</b>.
          <b> 액파</b>=액정파손 매입가, <b>통</b>=통기계(작동O·외관하급). 액정·뒷판·사설수리 등은 <b>계산기 탭</b>에서 차감 반영하세요.
        </p>
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
          placeholder="🔍 모델·용량·코드 검색 (예: 17 pro, 512, S928)"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      <p className="px-1 text-xs text-slate-500">
        {total}개 · 단위 <b>만원</b> · 셀 값은 <b>최대 매입가</b>(상태 차감 전)
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

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left font-semibold dark:bg-slate-800/70">모델 · 용량</th>
                    {cols.map((c) => (
                      <th key={c.key} className={'px-2.5 py-2.5 text-right font-semibold ' + c.cls}>
                        {c.label}
                        <span className="block text-[9px] font-normal opacity-70">{c.sub}</span>
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
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5">
                        <div className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                          {m.name}
                          <span className="text-[11px] font-normal text-slate-400">{m.cap}</span>
                          {m.code && <span className="text-[10px] font-normal text-slate-300 dark:text-slate-600">{m.code}</span>}
                        </div>
                      </td>
                      {cols.map((c) => (
                        <td
                          key={c.key}
                          className={'tnum px-2.5 py-2.5 text-right ' + c.cls + (c.bold ? ' font-bold' : '')}
                        >
                          {m[c.key] == null ? <span className="text-slate-300 dark:text-slate-700">–</span> : manwon(m[c.key])}
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
        ※ {prices.note}
      </p>
    </div>
  )
}
