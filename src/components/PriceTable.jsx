import { useMemo, useState } from 'react'
import prices from '../data/prices.json'
import { manwon } from '../lib/hooks'

const BRANDS = ['전체', '애플', '삼성']

// 날짜 MM/DD 표기
const md = (d) => { const [, m, day] = String(d || '').split('-'); return m && day ? `${+m}/${+day}` : d }

// series 등장 순서 유지
function seriesOrder(models) {
  const seen = []
  for (const m of models) if (!seen.includes(m.series)) seen.push(m.series)
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

const FONT_STEPS = [12, 14, 16, 19, 22] // 표 글자 크기(px) 단계
const FONT_KEY = 'psm_price_font'

export default function PriceTable() {
  const [brand, setBrand] = useState('전체')
  const [q, setQ] = useState('')
  const [day, setDay] = useState('today') // today(금일) | prev(전일)
  const [fontLv, setFontLv] = useState(() => {
    const v = Number(typeof localStorage !== 'undefined' && localStorage.getItem(FONT_KEY))
    return Number.isInteger(v) && v >= 0 && v < FONT_STEPS.length ? v : 1
  })
  const setFont = (lv) => {
    const n = Math.max(0, Math.min(FONT_STEPS.length - 1, lv))
    setFontLv(n)
    try { localStorage.setItem(FONT_KEY, String(n)) } catch { /* noop */ }
  }
  const fs = FONT_STEPS[fontLv] // 본문 px
  const capFs = Math.round(fs * 0.72) // 용량·코드 px

  const hasPrev = !!prices.prevModels && !!prices.prevDate
  const activeModels = day === 'prev' && hasPrev ? prices.prevModels : prices.models
  const activeDate = day === 'prev' && hasPrev ? prices.prevDate : prices.baseDate

  const groups = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const filtered = activeModels.filter(
      (m) =>
        (brand === '전체' || m.brand === brand) &&
        (!kw || (m.name + ' ' + m.cap + ' ' + (m.code || '')).toLowerCase().includes(kw)),
    )
    const order = seriesOrder(activeModels)
    const map = {}
    for (const m of filtered) (map[m.series] ||= []).push(m)
    return order.filter((s) => map[s]).map((s) => ({ series: s, brand: map[s][0].brand, rows: map[s] }))
  }, [brand, q, day, activeModels])

  const total = groups.reduce((n, g) => n + g.rows.length, 0)

  return (
    <div className="space-y-4">
      {/* 전일/금일 토글 */}
      {hasPrev && (
        <div className="flex items-center justify-center gap-2">
          <div className="flex w-full max-w-xs rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setDay('prev')}
              className={'flex-1 rounded-full py-2 text-sm font-bold transition-colors ' + (day === 'prev' ? 'bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400')}
            >전일 {md(prices.prevDate)}</button>
            <button
              onClick={() => setDay('today')}
              className={'flex-1 rounded-full py-2 text-sm font-bold transition-colors ' + (day === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400')}
            >금일 {md(prices.baseDate)}</button>
          </div>
        </div>
      )}
      {day === 'prev' && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[12px] font-bold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          📅 전일({md(prices.prevDate)}) 시세를 보고 있습니다 — 매입은 금일 시세 기준입니다.
        </div>
      )}

      {/* 안내 배너 */}
      <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
        <b>{prices.source}</b> 매입 시세 (만원) · 기준일 <b className="text-indigo-600 dark:text-indigo-300">{activeDate}</b>
        <div className="mt-0.5 font-bold text-indigo-600 dark:text-indigo-300">{prices.updateNote}</div>
        <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300">🚚 대구 전 지역 당일 방문 픽업 가능</div>
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

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500">
          {total}개 · 단위 <b>만원</b> · 차감 전 <b>최대가</b>
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">글자</span>
          <button
            onClick={() => setFont(fontLv - 1)}
            disabled={fontLv === 0}
            aria-label="글자 작게"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-lg font-bold text-slate-600 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300"
          >−</button>
          <button
            onClick={() => setFont(fontLv + 1)}
            disabled={fontLv === FONT_STEPS.length - 1}
            aria-label="글자 크게"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-lg font-bold text-slate-600 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300"
          >＋</button>
        </div>
      </div>

      {groups.map((g) => {
        const cols = g.brand === '애플' ? COLS_APPLE : COLS_SAMSUNG
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
                <colgroup>
                  <col style={{ width: g.brand === '애플' ? '32%' : '28%' }} />
                  {cols.map((c) => <col key={c.key} />)}
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    <th className="px-2 py-2 text-left font-semibold" style={{ fontSize: Math.round(fs * 0.82) }}>모델</th>
                    {cols.map((c) => (
                      <th key={c.key} className={'px-0 py-2 text-center font-bold ' + c.cls} style={{ fontSize: Math.round(fs * 0.82) }}>
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
                      <td className="px-2 py-2">
                        <div className="truncate font-semibold leading-tight" style={{ fontSize: fs }}>{m.name}</div>
                        <div className="truncate leading-tight text-slate-400" style={{ fontSize: capFs }}>{m.cap}{m.code ? ' · ' + m.code : ''}</div>
                      </td>
                      {cols.map((c) => (
                        <td
                          key={c.key}
                          className={'tnum px-0 py-2 text-center ' + c.cls + (c.bold ? ' font-bold' : '')}
                          style={{ fontSize: fs }}
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
