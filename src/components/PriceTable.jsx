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

export default function PriceTable() {
  const [brand, setBrand] = useState('전체')
  const [q, setQ] = useState('')
  const [openNote, setOpenNote] = useState('')

  const groups = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const filtered = prices.models.filter(
      (m) =>
        (brand === '전체' || m.brand === brand) &&
        (!kw || (m.name + ' ' + m.cap).toLowerCase().includes(kw)),
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
      <div className="flex gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        <span>💡</span>
        <p>
          <b>최대 매입가 기준표</b> (단위: 만원) · 배터리 등급 <b>A급 90%↑ / A-급 85%↑ / B급 80%↑</b>.
          아래 가격은 <b>고객에게 지불하는 매입가</b>이며, 액정파손·뒷판·사설수리 등은 각 시리즈 <b>차감 항목</b>을 추가로 뺍니다.
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
          placeholder="🔍 모델·용량 검색 (예: 17 pro, 512)"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      <p className="px-1 text-xs text-slate-500">
        {total}개 · 단위 <b>만원</b> · <span className="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">추정</span> 배지는 사진 판독 불확실 → 검수 요망
      </p>

      {groups.map((g) => (
        <section key={g.series}>
          <div className="mb-1.5 flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold">
              <span className="mr-1 text-[11px] text-slate-400">{g.brand}</span>
              {g.series}
            </h2>
            {prices.seriesNotes[g.series] && (
              <button
                onClick={() => setOpenNote((o) => (o === g.series ? '' : g.series))}
                className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700"
              >
                차감 항목 {openNote === g.series ? '▲' : '▼'}
              </button>
            )}
          </div>
          {openNote === g.series && prices.seriesNotes[g.series] && (
            <p className="mb-2 rounded-xl bg-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              {prices.seriesNotes[g.series]}
            </p>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left font-semibold dark:bg-slate-800/70">모델 · 용량</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">A급<span className="block text-[9px] font-normal opacity-70">배터리 90%↑</span></th>
                  <th className="px-3 py-2.5 text-right font-semibold text-sky-600 dark:text-sky-400">A-급<span className="block text-[9px] font-normal opacity-70">85%↑</span></th>
                  <th className="px-3 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">B급<span className="block text-[9px] font-normal opacity-70">80%↑</span></th>
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
                        {m.estimated && (
                          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">추정</span>
                        )}
                      </div>
                    </td>
                    <td className="tnum px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{manwon(m.A)}</td>
                    <td className="tnum px-3 py-2.5 text-right text-sky-600 dark:text-sky-400">{manwon(m.Am)}</td>
                    <td className="tnum px-3 py-2.5 text-right text-amber-600 dark:text-amber-400">{manwon(m.B)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {total === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">검색 결과가 없어요.</p>
      )}

      <p className="px-1 text-[11px] text-slate-400">
        ※ 두 매입 시세표 중 더 높은 값(최대 매입가) 기준. 실제 지급 시 배터리 등급 + 상태 차감을 반영하세요.
      </p>
    </div>
  )
}
