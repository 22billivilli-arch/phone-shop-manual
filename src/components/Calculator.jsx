import { useMemo, useState } from 'react'
import prices from '../data/prices.json'
import { manwon } from '../lib/hooks'

const GRADE_BTN = {
  emerald: 'border-emerald-500 bg-emerald-500 text-white',
  sky: 'border-sky-500 bg-sky-500 text-white',
  indigo: 'border-indigo-500 bg-indigo-500 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
  slate: 'border-slate-500 bg-slate-500 text-white',
  rose: 'border-rose-500 bg-rose-500 text-white',
}

export default function Calculator() {
  const [idx, setIdx] = useState('')
  const [grade, setGrade] = useState('A')
  const [checked, setChecked] = useState({})

  const model = idx === '' ? null : prices.models[Number(idx)]

  // 이 모델에 존재하는 등급 버튼만
  const grades = useMemo(() => {
    if (!model) return prices.grades.filter((g) => !g.samsungOnly)
    return prices.grades.filter((g) => model[g.key] != null && (!g.samsungOnly || model.brand === '삼성'))
  }, [model])

  // 이 모델의 차감 항목 (브랜드별 순서 + 존재하는 것만)
  const deductions = useMemo(() => {
    if (!model) return []
    const order = prices.dedOrder[model.brand] || []
    return order
      .filter((k) => model.d && model.d[k] != null)
      .map((k) => ({ id: k, label: prices.dedLabels[k] || k, amount: Math.abs(model.d[k]) }))
  }, [model])

  const result = useMemo(() => {
    const base = model ? (model[grade] ?? 0) : 0
    let deduction = 0
    for (const d of deductions) if (checked[d.id]) deduction += d.amount
    const buy = Math.max(0, base - deduction)
    return { base, deduction, buy }
  }, [model, grade, checked, deductions])

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }))
  const pickModel = (v) => { setIdx(v); setChecked({}); setGrade('A') }

  const gradeMeta = grades.find((g) => g.key === grade) || prices.grades.find((g) => g.key === grade)

  return (
    <div className="space-y-4">
      {/* 입력 */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">모델 · 용량 선택</label>
          <select
            value={idx}
            onChange={(e) => pickModel(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">모델을 선택하세요…</option>
            {prices.models.map((m, i) => (
              <option key={m.name + m.cap + i} value={i}>
                [{m.brand}] {m.name} · {m.cap}{m.code ? ` (${m.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">등급 선택</label>
          <div className="grid grid-cols-3 gap-2">
            {grades.map((g) => (
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
          {model && grade !== 'broken' && model.broken != null && (
            <p className="mt-1.5 px-1 text-[11px] text-slate-400">
              액정파손 시 <b className="text-rose-500">액파 {manwon(model.broken)}만원</b>으로 매입 (위 액파 버튼)
            </p>
          )}
        </div>
      </section>

      {/* 차감 항목 (HK 시세표 실제 차감값) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-bold">
          상태 차감 <span className="text-[11px] font-normal text-slate-400">(HK 시세표 기준 · 해당되면 체크)</span>
        </h2>
        {deductions.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">모델을 선택하면 차감 항목이 나옵니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {deductions.map((d) => {
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
        )}
        {model && model.brand === '삼성' && (
          <p className="mt-2 px-1 text-[11px] text-slate-400">※ 잔상(약/중/강)은 해당 강도 하나만 체크하세요.</p>
        )}
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
                {gradeMeta?.label} {manwon(result.base)}만원
                {result.deduction > 0 && <> − 차감 {result.deduction}만원</>}
              </>
            ) : (
              '모델을 선택하세요'
            )}
          </p>
          {model && model.dead != null && (
            <p className="mt-2 text-[11px] text-slate-400">
              💀 완전 폐급(부팅 불가 등) <b className="text-slate-600 dark:text-slate-300">부품 매입가 {manwon(model.dead)}만원</b>
              <span className="ml-1 opacity-70">— 등급가와 별개인 단독 매입가</span>
            </p>
          )}
        </div>
      </section>

      <p className="px-1 text-[11px] text-slate-400">
        ※ 제시가 = 등급 매입가 − 상태 차감 합계. 차감값은 HK 시세표({prices.baseDate}) 실제 항목입니다. 최종 지급은 검수 후 확정하세요.
      </p>
    </div>
  )
}
