import { useMemo, useState } from 'react'
import prices from '../data/prices.json'
import { manwon } from '../lib/hooks'

const GRADES = [
  { key: 'A', label: 'A급', battery: '배터리 90%↑', color: 'emerald' },
  { key: 'Am', label: 'A-급', battery: '배터리 85%↑', color: 'sky' },
  { key: 'B', label: 'B급', battery: '배터리 80%↑', color: 'amber' },
]
const GRADE_BTN = {
  emerald: 'border-emerald-500 bg-emerald-500 text-white',
  sky: 'border-sky-500 bg-sky-500 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
}

// 상태 차감 항목 (만원) — 매장 상황에 맞게 조정하세요. 배터리 등급과 별개로 추가 차감.
const DEDUCTIONS = [
  { id: 'lcd', label: '액정 파손 / 액파', amount: 15 },
  { id: 'back', label: '뒷판 파손', amount: 5 },
  { id: 'cam', label: '카메라 변색 / 불량', amount: 10 },
  { id: 'repair', label: '사설 수리 이력', amount: 20 },
  { id: 'part', label: '정품 아님 문구', amount: 5 },
  { id: 'vib', label: '진동 / 볼륨 불량', amount: 5 },
  { id: 'charge', label: '충전 불량', amount: 5 },
  { id: 'bio', label: '페이스ID / 지문 불량', amount: 15 },
]

export default function Calculator() {
  const [idx, setIdx] = useState('')
  const [grade, setGrade] = useState('A')
  const [checked, setChecked] = useState({})

  const model = idx === '' ? null : prices.models[Number(idx)]

  const result = useMemo(() => {
    const base = model ? (model[grade] ?? 0) : 0
    let deduction = 0
    for (const d of DEDUCTIONS) if (checked[d.id]) deduction += d.amount
    const buy = Math.max(0, base - deduction)
    return { base, deduction, buy }
  }, [model, grade, checked])

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }))

  return (
    <div className="space-y-4">
      {/* 입력 */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">모델 · 용량 선택</label>
          <select
            value={idx}
            onChange={(e) => setIdx(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">모델을 선택하세요…</option>
            {prices.models.map((m, i) => (
              <option key={m.name + m.cap + i} value={i}>
                [{m.brand}] {m.name} · {m.cap}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">배터리 등급</label>
          <div className="grid grid-cols-3 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.key}
                onClick={() => setGrade(g.key)}
                className={
                  'rounded-xl border-2 py-2 text-sm font-extrabold transition-colors ' +
                  (grade === g.key ? GRADE_BTN[g.color] : 'border-slate-200 text-slate-500 dark:border-slate-700')
                }
              >
                {g.label}
                <span className="block text-[9px] font-semibold opacity-80">{g.battery}</span>
                <span className="tnum block text-[11px] font-bold">{model ? manwon(model[g.key]) : '-'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 차감 항목 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-bold">상태 차감 항목 <span className="text-[11px] font-normal text-slate-400">(해당되면 체크)</span></h2>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {DEDUCTIONS.map((d) => {
            const on = !!checked[d.id]
            return (
              <label
                key={d.id}
                className={
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-sm transition-colors ' +
                  (on ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10' : 'border-slate-200 dark:border-slate-800')
                }
              >
                <input type="checkbox" checked={on} onChange={() => toggle(d.id)} className="h-5 w-5 flex-shrink-0 accent-red-500" />
                <span className="flex-1">{d.label}</span>
                <span className="tnum text-xs font-bold text-red-500">−{d.amount}</span>
              </label>
            )
          })}
        </div>
      </section>

      {/* 결과 */}
      <section className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/40 dark:bg-indigo-500/10">
        <div className="rounded-xl bg-white p-5 text-center shadow-sm dark:bg-slate-900">
          <p className="text-xs font-bold text-slate-500">제시 매입가</p>
          <p className="tnum mt-1 text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {manwon(result.buy)}<span className="text-base">만원</span>
          </p>
          <p className="mt-1.5 text-[11px] text-slate-400 tnum">
            {model ? (
              <>
                {GRADES.find((g) => g.key === grade)?.label} {manwon(result.base)}만원
                {result.deduction > 0 && <> − 차감 {result.deduction}만원</>}
              </>
            ) : (
              '모델을 선택하세요'
            )}
          </p>
        </div>
      </section>

      <p className="px-1 text-[11px] text-slate-400">
        ※ 제시 매입가 = 등급 매입가 − 상태 차감 합계. 차감 금액은 예시값이며 매장 기준에 맞게 조정하세요.
      </p>
    </div>
  )
}
