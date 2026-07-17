import { useMemo, useState } from 'react'
import prices from '../data/prices.json'
import manual from '../data/manual.json'
import { useRates, won } from '../lib/hooks'

const GRADES = [
  { key: 'S', label: 'S급', color: 'emerald' },
  { key: 'A', label: 'A급', color: 'sky' },
  { key: 'B', label: 'B급', color: 'amber' },
]
const GRADE_BTN = {
  emerald: 'border-emerald-500 bg-emerald-500 text-white',
  sky: 'border-sky-500 bg-sky-500 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
}

export default function Calculator() {
  const [rates] = useRates()
  const [modelIdx, setModelIdx] = useState('')
  const [price, setPrice] = useState(0)
  const [grade, setGrade] = useState('S')
  const [checked, setChecked] = useState({})

  const onPickModel = (val) => {
    setModelIdx(val)
    if (val !== '') setPrice(prices.models[Number(val)].price)
  }

  const result = useMemo(() => {
    const rate = rates[grade] ?? 0
    let deduction = 0
    for (const d of manual.calcDeductions) {
      if (!checked[d.id]) continue
      deduction += d.type === 'rate' ? Math.round(price * d.value) : d.value
    }
    const base = Math.round(price * rate)
    const buy = Math.max(0, base - deduction)
    const sell = price
    const margin = sell - buy
    return { rate, base, deduction, buy, sell, margin }
  }, [rates, grade, price, checked])

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }))

  return (
    <div className="space-y-4">
      {/* 입력 */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">모델 선택</label>
          <select
            value={modelIdx}
            onChange={(e) => onPickModel(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">직접 입력 / 모델 선택…</option>
            {prices.models.map((m, i) => (
              <option key={m.brand + m.model} value={i}>
                [{m.brand}] {m.model} · {won(m.price)}원
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">판매시세 (원, 직접 수정 가능)</label>
          <input
            type="number"
            inputMode="numeric"
            value={price || ''}
            onChange={(e) => {
              setPrice(Number(e.target.value) || 0)
              setModelIdx('')
            }}
            placeholder="예: 860000"
            className="tnum w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-lg font-bold dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">등급</label>
          <div className="grid grid-cols-3 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.key}
                onClick={() => setGrade(g.key)}
                className={
                  'rounded-xl border-2 py-2.5 text-sm font-extrabold transition-colors ' +
                  (grade === g.key
                    ? GRADE_BTN[g.color]
                    : 'border-slate-200 text-slate-500 dark:border-slate-700')
                }
              >
                {g.label}
                <span className="block text-[10px] font-semibold opacity-80">
                  {Math.round((rates[g.key] ?? 0) * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 감가 항목 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-bold">기능 감가 항목</h2>
        <div className="space-y-1.5">
          {manual.calcDeductions.map((d) => {
            const on = !!checked[d.id]
            const amount = d.type === 'rate' ? Math.round(price * d.value) : d.value
            return (
              <label
                key={d.id}
                className={
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-sm transition-colors ' +
                  (on
                    ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10'
                    : 'border-slate-200 dark:border-slate-800')
                }
              >
                <input type="checkbox" checked={on} onChange={() => toggle(d.id)} className="h-5 w-5 flex-shrink-0 accent-red-500" />
                <span className="flex-1">
                  {d.label} <span className="text-[11px] text-slate-400">({d.note})</span>
                </span>
                {on && <span className="tnum text-xs font-bold text-red-500">−{won(amount)}</span>}
              </label>
            )
          })}
        </div>
      </section>

      {/* 결과 */}
      <section className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/40 dark:bg-indigo-500/10">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-xl bg-white p-4 text-center shadow-sm dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500">제시 매입가</p>
            <p className="tnum mt-1 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{won(result.buy)}<span className="text-base">원</span></p>
            <p className="mt-1 text-[11px] text-slate-400 tnum">
              {won(price)} × {Math.round(result.rate * 100)}%
              {result.deduction > 0 && <> − 감가 {won(result.deduction)}</>}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500">예상 판매가</p>
            <p className="tnum mt-1 text-xl font-bold">{won(result.sell)}</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500">예상 마진</p>
            <p className={'tnum mt-1 text-xl font-bold ' + (result.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
              {won(result.margin)}
            </p>
          </div>
        </div>
      </section>

      <p className="px-1 text-[11px] text-slate-400">
        ※ 제시 매입가 = 판매시세 × 등급배율 − 기능 감가 합계. 배율은 시세표 탭의 설정을 따릅니다.
      </p>
    </div>
  )
}
