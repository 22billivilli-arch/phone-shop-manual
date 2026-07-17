import { useState } from 'react'
import manual from '../data/manual.json'
import { useLocalStorage } from '../lib/hooks'

const GRADE_COLORS = {
  emerald: 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10',
  sky: 'border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/10',
  amber: 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10',
}
const GRADE_TEXT = {
  emerald: 'text-emerald-700 dark:text-emerald-300',
  sky: 'text-sky-700 dark:text-sky-300',
  amber: 'text-amber-700 dark:text-amber-300',
}

function Section({ n, title, children }) {
  return (
    <section className="scroll-mt-16">
      <h2 className="mb-2.5 flex items-center gap-2 text-base font-extrabold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ' + className}>
      {children}
    </div>
  )
}

// ── 아코디언 ──
function Accordion({ items }) {
  const [open, setOpen] = useState(-1)
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {items.map((it, i) => {
        const on = open === i
        return (
          <div key={it.part}>
            <button
              onClick={() => setOpen(on ? -1 : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
            >
              <span>{it.part}</span>
              <span className={'text-slate-400 transition-transform ' + (on ? 'rotate-180' : '')}>▾</span>
            </button>
            {on && (
              <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{it.detail}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── 검수 체크리스트 (localStorage 저장) ──
function Checklist() {
  const [checked, setChecked] = useLocalStorage('psm_checklist', {})
  const steps = manual.inspectionSteps
  const done = steps.filter((_, i) => checked[i]).length
  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }))
  const reset = () => setChecked({})

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold">
          진행 <span className="tnum text-indigo-600 dark:text-indigo-400">{done}</span> / {steps.length}
        </span>
        <button
          onClick={reset}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-700"
        >
          초기화
        </button>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: (done / steps.length) * 100 + '%' }}
        />
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const on = !!checked[i]
          return (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                className={
                  'flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-sm transition-colors ' +
                  (on
                    ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800')
                }
              >
                <span
                  className={
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-xs ' +
                    (on
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-600')
                  }
                >
                  {on ? '✓' : i + 1}
                </span>
                <span className={on ? 'text-slate-400 line-through' : ''}>{s}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

// ── 판정 예시 ──
function Quiz() {
  return (
    <div className="space-y-2.5">
      {manual.quizCases.map((c, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed">{c.desc}</p>
          </div>
          <div className="mt-2.5 pl-8">
            <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
              <span className="inline-block rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                {c.answer}
              </span>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{c.reason}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Manual() {
  const { principles, grades, partCriteria, functionDeductions, prohibitions } = manual

  return (
    <div className="space-y-8">
      {/* 1. 판정 원칙 */}
      <Section n="1" title="판정 원칙">
        <div className="space-y-2">
          {principles.map((p, i) => (
            <Card key={i} className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{p}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 2. 등급별 기준 */}
      <Section n="2" title="S / A / B급 비교">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {grades.items.map((g) => (
            <div key={g.grade} className={'rounded-2xl border p-4 ' + GRADE_COLORS[g.color]}>
              <div className="flex items-baseline gap-1.5">
                <span className={'text-lg font-extrabold ' + GRADE_TEXT[g.color]}>{g.grade}</span>
                <span className="text-xs text-slate-500">{g.sub}</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold">{g.def}</p>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">🔋 {g.battery}</p>
              <dl className="mt-3 space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                {grades.criteria.map((c) => (
                  <div key={c.label}>
                    <dt className="text-[11px] font-bold text-slate-400">{c.label}</dt>
                    <dd className="text-xs leading-snug">{c[g.key]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2.5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-semibold leading-relaxed text-red-700 dark:text-red-300">{grades.cWarning}</p>
        </div>
      </Section>

      {/* 3. 부위별 세부 기준 */}
      <Section n="3" title="부위별 세부 기준">
        <Accordion items={partCriteria} />
      </Section>

      {/* 4. 기능 감가표 */}
      <Section n="4" title="기능 감가표">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                <th className="px-3 py-2.5 text-left font-semibold">항목</th>
                <th className="px-3 py-2.5 text-left font-semibold">확인 방법</th>
                <th className="px-3 py-2.5 text-left font-semibold">차감 기준</th>
              </tr>
            </thead>
            <tbody>
              {functionDeductions.map((d, i) => (
                <tr key={d.item} className={'border-t border-slate-100 dark:border-slate-800 ' + (i % 2 ? 'bg-slate-50/40 dark:bg-slate-800/20' : '')}>
                  <td className="px-3 py-2.5 font-semibold">{d.item}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">{d.method}</td>
                  <td className="px-3 py-2.5 text-xs">{d.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 5. 표준 검수 절차 */}
      <Section n="5" title="표준 검수 절차 (체크리스트)">
        <Checklist />
      </Section>

      {/* 6. 판정 예시 */}
      <Section n="6" title="판정 예시">
        <Quiz />
      </Section>

      {/* 7. 금지 사항 */}
      <Section n="7" title="금지 사항">
        <div className="space-y-2">
          {prohibitions.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 dark:border-red-500/40 dark:bg-red-500/10">
              <span className="text-red-500">🚫</span>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">{p}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
