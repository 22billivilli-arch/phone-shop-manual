import { useEffect, useMemo, useState } from 'react'
import prices from '../data/prices.json'
import { useLocalStorage, won } from '../lib/hooks'
import { api } from '../lib/api'

// 만원 → 원
const toWon = (manwon) => Math.round((manwon || 0) * 10000)

export default function Cart({ cart, setCart, auth }) {
  const [store, setStore] = useLocalStorage('psm_store', { shop: '', owner: '', phone: '', addr: '' })
  const [saved, setSaved] = useState('')
  const member = auth?.role === 'member' ? auth.member : null

  // 로그인한 거래처면 정보 자동 입력
  useEffect(() => {
    if (member) setStore({ shop: member.shop_name || '', owner: member.name || '', phone: member.phone || '', addr: member.shop_addr || '' })
  }, [member?.id])

  const setField = (k, v) => setStore((s) => ({ ...s, [k]: v }))
  const setQty = (id, q) => setCart((c) => c.map((it) => (it.id === id ? { ...it, qty: Math.max(1, Number(q) || 1) } : it)))
  const setImei = (id, v) => setCart((c) => c.map((it) => (it.id === id ? { ...it, imei: v } : it)))
  const remove = (id) => setCart((c) => c.filter((it) => it.id !== id))
  const clear = () => { if (confirm('출고 목록을 모두 비울까요?')) setCart([]) }

  const totalWon = useMemo(() => cart.reduce((s, it) => s + toWon(it.unit) * it.qty, 0), [cart])
  const totalQty = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart])

  const submit = async () => {
    if (!cart.length) return
    const now = new Date()
    const docNo = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    // 서버에 매입 자료로 저장 (백엔드 있으면). 실패해도 계약서는 발행.
    try {
      await api.post('order_submit.php', { doc_no: docNo, store, items: cart })
      setSaved('서버에 매입 자료로 저장되었습니다.')
    } catch {
      setSaved('※ 서버 저장은 안 됐지만(오프라인/미연결) 계약서는 발행됩니다.')
    }
    openContract({ store, cart, totalWon, totalQty, docNo })
    setTimeout(() => setSaved(''), 4000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
        📤 <b>출고 신청</b> · 계산기에서 담은 기기들을 한 번에 <b>매매계약서</b>로 만듭니다. (매입 자료로 보관/인쇄)
      </div>

      {/* 거래처 정보 */}
      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold">거래처(판매자) 정보</h2>
        <div className="grid grid-cols-2 gap-2">
          <input value={store.shop} onChange={(e) => setField('shop', e.target.value)} placeholder="매장명" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={store.owner} onChange={(e) => setField('owner', e.target.value)} placeholder="대표자명" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={store.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="연락처" inputMode="tel" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={store.addr} onChange={(e) => setField('addr', e.target.value)} placeholder="매장 주소" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <p className="text-[11px] text-slate-400">※ 회원가입 연동 후에는 로그인 정보로 자동 입력됩니다.</p>
      </section>

      {/* 담은 목록 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold">출고 목록 <span className="text-slate-400">({cart.length}종 · {totalQty}대)</span></h2>
          {cart.length > 0 && (
            <button onClick={clear} className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700">전체 비우기</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400 dark:border-slate-700">
            아직 담은 기기가 없어요.<br />🧮 매입 계산기에서 <b>담기</b>로 추가하세요.
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((it) => (
              <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold">
                      {it.name} <span className="text-[11px] font-normal text-slate-400">{it.cap}</span>
                      <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{it.gradeLabel}</span>
                    </div>
                    {it.deductLabels?.length > 0 && (
                      <div className="mt-0.5 text-[10px] text-rose-500">차감: {it.deductLabels.join(', ')}</div>
                    )}
                  </div>
                  <button onClick={() => remove(it.id)} className="flex-shrink-0 text-slate-400" aria-label="삭제">✕</button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input value={it.imei || ''} onChange={(e) => setImei(it.id, e.target.value)} placeholder="IMEI" inputMode="numeric" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900" />
                  <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700">
                    <button onClick={() => setQty(it.id, it.qty - 1)} className="px-2.5 py-1 font-bold text-slate-500">−</button>
                    <span className="tnum w-7 text-center text-xs">{it.qty}</span>
                    <button onClick={() => setQty(it.id, it.qty + 1)} className="px-2.5 py-1 font-bold text-slate-500">+</button>
                  </div>
                  <span className="tnum w-24 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">{won(toWon(it.unit) * it.qty)}원</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 합계 + 출고신청 */}
      {cart.length > 0 && (
        <section className="sticky bottom-16 rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-500/40 dark:bg-indigo-500/10">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-bold">합계 <span className="text-slate-400">({totalQty}대)</span></span>
            <span className="tnum text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{won(totalWon)}원</span>
          </div>
          <button onClick={submit} className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-extrabold text-white active:bg-indigo-700">
            📄 출고 신청 · 매매계약서 작성
          </button>
          {saved && <p className="mt-2 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{saved}</p>}
        </section>
      )}
    </div>
  )
}

// ── 매매계약서 (새 창 인쇄/PDF) ──
function openContract({ store, cart, totalWon, totalQty, docNo }) {
  const now = new Date()
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const wonf = (n) => Math.round(n || 0).toLocaleString('ko-KR')

  const rows = cart.map((it, i) => {
    const unitWon = Math.round((it.unit || 0) * 10000)
    return `<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(it.brand)} ${esc(it.name)}</td>
      <td class="c">${esc(it.cap)}</td>
      <td class="c">${esc(it.gradeLabel)}</td>
      <td class="c">${esc(it.imei || '-')}</td>
      <td class="c">${it.qty}</td>
      <td class="r">${wonf(unitWon)}</td>
      <td class="r">${wonf(unitWon * it.qty)}</td>
    </tr>`
  }).join('')

  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
  <title>중고폰 매매계약서 ${docNo}</title>
  <style>
    *{box-sizing:border-box} body{font-family:'Malgun Gothic',sans-serif;color:#111;margin:0;padding:26px;font-size:13px;line-height:1.5}
    h1{text-align:center;font-size:22px;letter-spacing:8px;margin:0 0 4px}
    .meta{text-align:center;color:#666;font-size:11px;margin-bottom:18px}
    .party{display:flex;gap:14px;margin-bottom:16px}
    .box{flex:1;border:1px solid #333;border-radius:6px;padding:10px 12px}
    .box h3{margin:0 0 6px;font-size:12px;color:#444;border-bottom:1px solid #ddd;padding-bottom:4px}
    .box p{margin:3px 0;font-size:12px}
    .box b{display:inline-block;width:56px;color:#666}
    table{width:100%;border-collapse:collapse;margin-bottom:10px}
    th,td{border:1px solid #999;padding:6px 5px;font-size:12px}
    th{background:#f0f0f0}
    td.c{text-align:center} td.r{text-align:right}
    tfoot td{font-weight:bold;background:#fafafa}
    .terms{font-size:11px;color:#444;line-height:1.7;border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin-bottom:18px}
    .sign{display:flex;justify-content:space-between;gap:20px;margin-top:24px;font-size:12px}
    .sign div{flex:1}
    .sline{display:inline-block;border-bottom:1px solid #333;min-width:130px;margin:0 4px}
    .print-btn{position:fixed;top:12px;right:12px;background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:bold;cursor:pointer}
    @media print{.print-btn{display:none}}
  </style></head><body>
  <button class="print-btn" onclick="window.print()">🖨 인쇄 / PDF 저장</button>
  <h1>중 고 폰 매 매 계 약 서</h1>
  <div class="meta">문서번호 ${docNo} · 작성일 ${ymd}</div>

  <div class="party">
    <div class="box"><h3>매입자 (갑)</h3>
      <p><b>상호</b> ${esc(prices.source)}</p>
      <p><b>연락처</b> ${esc(prices.tel)}</p>
      <p><b>주소</b> 대구 달서구 송현동 1036-8, 4층</p>
    </div>
    <div class="box"><h3>판매자 (을)</h3>
      <p><b>매장명</b> ${esc(store.shop) || '&nbsp;'}</p>
      <p><b>대표자</b> ${esc(store.owner) || '&nbsp;'}</p>
      <p><b>연락처</b> ${esc(store.phone) || '&nbsp;'}</p>
      <p><b>주소</b> ${esc(store.addr) || '&nbsp;'}</p>
    </div>
  </div>

  <table>
    <thead><tr>
      <th style="width:32px">No</th><th>모델</th><th style="width:56px">용량</th><th style="width:50px">등급</th>
      <th style="width:120px">IMEI</th><th style="width:38px">수량</th><th style="width:88px">단가(원)</th><th style="width:96px">금액(원)</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="5" class="r">합계</td><td class="c">${totalQty}</td><td></td><td class="r">${wonf(totalWon)}</td>
    </tr></tfoot>
  </table>

  <div class="terms">
    1. 을은 위 기기가 <b>분실·도난·할부금 미납 기기가 아님</b>을 보증하며, 사후 문제 발생 시 을이 책임진다.<br>
    2. 매입 단가는 검수 완료 후 등급·상태에 따라 조정될 수 있으며, 최종 금액은 검수 후 확정한다.<br>
    3. 대금은 검수 완료 후 을이 지정한 계좌로 지급한다.<br>
    4. 기기의 데이터 초기화 및 계정(iCloud·Google) 잠금 해제는 을의 책임으로 한다.<br>
    5. 본 계약서는 매입 자료로 보관되며, 상기 내용에 상호 동의한다.
  </div>

  <div class="sign">
    <div>매입자(갑) ${esc(prices.source)} <span class="sline"></span> (인)</div>
    <div>판매자(을) <span class="sline"></span> (인)</div>
  </div>
  <div style="text-align:center;margin-top:16px;color:#888;font-size:11px">${ymd}</div>
  </body></html>`

  const w = window.open('', '_blank')
  if (!w) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return }
  w.document.write(html)
  w.document.close()
}
