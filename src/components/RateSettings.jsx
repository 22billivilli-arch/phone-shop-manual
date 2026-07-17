import { useRates, clamp } from '../lib/hooks'

const GRADES = [
  { key: 'S', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'A', color: 'text-sky-600 dark:text-sky-400' },
  { key: 'B', color: 'text-amber-600 dark:text-amber-400' },
]

// 매입배율 설정 (S/A/B, %) — 슬라이더 + 입력창, localStorage 저장. 시세표·계산기가 공유.
export default function RateSettings() {
  const [rates, setRates] = useRates()

  const setPct = (key, pct) => {
    const v = clamp(Math.round(pct), 0, 100) / 100
    setRates((r) => ({ ...r, [key]: v }))
  }
  const reset = () => setRates({ S: 0.8, A: 0.7, B: 0.58 })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">매입배율 설정</h2>
        <button
          onClick={reset}
          className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-700"
        >
          기본값
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {GRADES.map(({ key, color }) => (
          <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className={'text-sm font-extrabold ' + color}>{key}급</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(rates[key] * 100)}
                  onChange={(e) => setPct(key, Number(e.target.value))}
                  className="tnum w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(rates[key] * 100)}
              onChange={(e) => setPct(key, Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        매입시세 = 판매시세 × 배율. 배율을 바꾸면 아래 표·계산기에 즉시 반영돼요. (자동 저장)
      </p>
    </section>
  )
}
