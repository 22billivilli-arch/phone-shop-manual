import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import prices from '../data/prices.json'
import { useLocalStorage, won } from '../lib/hooks'
import { api } from '../lib/api'

// 만원 → 원
const toWon = (manwon) => Math.round((manwon || 0) * 10000)
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const wonf = (n) => Math.round(n || 0).toLocaleString('ko-KR')

// 회사 직인 이미지 — 추후 제공받으면 여기에 base64 dataURL 을 넣으면 계약서 갑 서명란에 자동 표시됨
const SEAL = ''

export default function Cart({ cart, setCart, auth, goTab }) {
  const [store, setStore] = useLocalStorage('psm_store', { shop: '', owner: '', phone: '', addr: '', bank: '', account: '' })
  const [saved, setSaved] = useState('')
  const [contract, setContract] = useState(null) // 계약서 모달 데이터
  const member = auth?.role === 'member' ? auth.member : null
  const isAdmin = auth?.role === 'admin'

  // 로그인한 거래처면 정보 자동 입력
  useEffect(() => {
    if (member) setStore({ shop: member.shop_name || '', owner: member.name || '', phone: member.phone || '', addr: member.shop_addr || '', bank: member.bank_name || '', account: member.account_no || '' })
  }, [member?.id])

  const setField = (k, v) => setStore((s) => ({ ...s, [k]: v }))
  const setQty = (id, q) => setCart((c) => c.map((it) => (it.id === id ? { ...it, qty: Math.max(1, Number(q) || 1) } : it)))
  const setImei = (id, v) => setCart((c) => c.map((it) => (it.id === id ? { ...it, imei: v } : it)))
  const remove = (id) => setCart((c) => c.filter((it) => it.id !== id))
  const clear = () => { if (confirm('출고 목록을 모두 비울까요?')) setCart([]) }

  const totalWon = useMemo(() => cart.reduce((s, it) => s + toWon(it.unit) * it.qty, 0), [cart])
  const totalQty = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart])

  // 택배/픽업 → 로그인 확인 후 매매계약서 모달만 연다(알림 전송 없음)
  const submit = (deliveryType) => {
    if (!cart.length) return
    // 거래처(member) 또는 관리자(admin)만 신청 가능. 비로그인은 회원 탭으로 유도.
    if (!member && !isAdmin) {
      alert('출고 신청은 거래처 로그인 후 이용할 수 있습니다.\n회원 탭에서 먼저 로그인해 주세요.')
      goTab && goTab('account')
      return
    }
    const now = new Date()
    const docNo = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    setContract({ store, cart, totalWon, totalQty, docNo, deliveryType })
  }

  // 계약서 [신청 완료] → 여기서 실제 서버 전송(메일+텔레)
  const handleContractSubmit = async ({ pdf, img, contract_html }) => {
    const d = contract
    await api.post('order_submit.php', {
      doc_no: d.docNo, store: d.store, items: d.cart, delivery_type: d.deliveryType,
      contract_pdf: pdf, contract_image: img, contract_html,
    })
    setCart([])
    setSaved(d.deliveryType === '픽업'
      ? '✅ 픽업 신청 완료! 계약서가 HK로 전송되었습니다. 방문 시간을 문자로 안내드립니다.'
      : '✅ 택배 신청 완료! 계약서가 HK로 전송되었습니다. 아래 발송지로 보내주세요.')
    setTimeout(() => setSaved(''), 9000)
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
          <input value={store.bank} onChange={(e) => setField('bank', e.target.value)} placeholder="은행" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={store.account} onChange={(e) => setField('account', e.target.value)} placeholder="계좌번호" inputMode="numeric" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">💳 정산 계좌는 <b>가입 시 등록한 통장사본과 동일한 계좌</b>여야 합니다.</p>
        <p className="text-[11px] text-slate-400">※ 로그인하면 위 정보가 자동 입력됩니다.</p>
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
          <div className="mb-3 rounded-xl bg-white/70 p-3 text-[11px] leading-relaxed dark:bg-slate-900/50">
            <div className="font-bold text-slate-700 dark:text-slate-200">🚚 택배 발송지</div>
            <div className="mt-0.5 text-slate-600 dark:text-slate-300">
              {prices.addr}<br />
              <b>{prices.source}</b> · {prices.tel}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(`${prices.addr} ${prices.source} ${prices.tel}`); setSaved('발송지 주소가 복사되었습니다.'); setTimeout(() => setSaved(''), 3000) }}
              className="mt-1.5 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-600">📋 주소 복사</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => submit('택배')} className="rounded-xl bg-indigo-600 py-3.5 text-sm font-extrabold text-white active:bg-indigo-700">🚚 택배 신청</button>
            <button onClick={() => submit('픽업')} className="rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white active:bg-emerald-700">🏠 픽업 신청</button>
          </div>
          <p className="mt-1 text-center text-[11px] text-slate-500">버튼을 누르면 <b>매매계약서</b> 작성 → 서명 → <b>신청 완료</b> 순서로 진행됩니다.</p>
          {saved && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-[12px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{saved}</p>}
        </section>
      )}

      {contract && (
        <ContractModal data={contract} onClose={() => setContract(null)} onSubmit={handleContractSubmit} />
      )}
    </div>
  )
}

// ── 계약서 본문 HTML (툴바/스크립트 없이 캡처용) ──
function buildPaperHtml({ store, cart, totalWon, totalQty, docNo, deliveryType }) {
  const now = new Date()
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
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

  return `<style>
    .hkc{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#111;font-size:13px;line-height:1.5}
    .hkc h1{text-align:center;font-size:22px;letter-spacing:8px;margin:0 0 4px;color:#111}
    .hkc .meta{text-align:center;color:#666;font-size:11px;margin-bottom:18px}
    .hkc .party{display:flex;gap:14px;margin-bottom:16px}
    .hkc .box{flex:1;border:1px solid #333;border-radius:6px;padding:10px 12px}
    .hkc .box h3{margin:0 0 6px;font-size:12px;color:#444;border-bottom:1px solid #ddd;padding-bottom:4px}
    .hkc .box p{margin:3px 0;font-size:12px}
    .hkc .box b{display:inline-block;width:56px;color:#666}
    .hkc table{width:100%;border-collapse:collapse;margin-bottom:10px}
    .hkc th,.hkc td{border:1px solid #999;padding:6px 5px;font-size:12px}
    .hkc th{background:#f0f0f0;white-space:nowrap}
    .hkc td.c{text-align:center} .hkc td.r{text-align:right}
    .hkc tfoot td{font-weight:bold;background:#fafafa}
    .hkc .deliv{font-size:12px;color:#333;background:#f4f6ff;border:1px solid #ccd4ff;border-radius:6px;padding:8px 12px;margin-bottom:12px}
    .hkc .terms{font-size:11px;color:#444;line-height:1.7;border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin-bottom:18px}
    .hkc .sign{display:flex;justify-content:space-between;gap:20px;margin-top:24px;font-size:12px;align-items:center}
    .hkc .sign > div{flex:1}
    .hkc .seal-ph{display:inline-block;width:52px;height:52px;border:1px dashed #bbb;border-radius:50%;text-align:center;line-height:52px;color:#bbb;font-size:11px;vertical-align:middle;margin-left:6px}
    .hkc .sig-btn{display:inline-block;border:1px solid #4f46e5;color:#4f46e5;border-radius:6px;padding:6px 12px;margin-left:4px;cursor:pointer;font-size:12px}
  </style>
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
      <p><b>정산계좌</b> ${esc((store.bank || '') + ' ' + (store.account || '')).trim() || '&nbsp;'}</p>
    </div>
  </div>
  <div class="deliv">
    <b>${deliveryType === '픽업' ? '🏠 방문 픽업' : deliveryType === '택배' ? '🚚 택배 발송' : '배송'}</b>
    ${deliveryType === '픽업'
      ? ' · HK 인터네셔널이 방문 수거 (방문 시간 문자 안내)'
      : ` · 발송지: ${esc(prices.addr)} <b>${esc(prices.source)}</b> ${esc(prices.tel)}`}
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
    <div>매입자(갑) ${esc(prices.source)}
      ${SEAL ? `<img src="${SEAL}" style="height:54px;vertical-align:middle;margin-left:6px">` : `<span class="seal-ph">직인</span>`}
    </div>
    <div>판매자(을) ${esc(store.owner) || ''}
      <span id="sigSlot"><span class="sig-btn">✍ 여기를 눌러 서명</span></span>
      <img id="sellerSig" style="display:none;height:52px;vertical-align:middle;margin-left:4px"> (인)
    </div>
  </div>
  <div style="text-align:center;margin-top:16px;color:#888;font-size:11px">${ymd}</div>`
}

// ── 매매계약서 모달 (앱 내 전체화면) ──
function ContractModal({ data, onClose, onSubmit }) {
  const paperRef = useRef(null)
  const scrollRef = useRef(null)
  const [showSig, setShowSig] = useState(false)
  const [signed, setSigned] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [fit, setFit] = useState({ scale: 1, h: 0 })
  const paperHtml = useMemo(() => buildPaperHtml(data), [data])

  // 계약서(760px)를 화면 폭에 맞춰 축소 표시 (구조·비율 유지, 캡처는 원본)
  useLayoutEffect(() => {
    const measure = () => {
      const sc = scrollRef.current, paper = paperRef.current
      if (!sc || !paper) return
      const avail = sc.clientWidth - 24
      const scale = Math.min(1, avail / 760)
      setFit({ scale, h: paper.offsetHeight * scale })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [paperHtml, signed])

  const onPaperClick = (e) => { if (e.target.closest('#sigSlot')) setShowSig(true) }

  const applySignature = (dataUrl) => {
    const root = paperRef.current
    if (root) {
      const img = root.querySelector('#sellerSig')
      if (img) { img.src = dataUrl; img.style.display = 'inline-block' }
      const slot = root.querySelector('#sigSlot')
      if (slot) slot.style.display = 'none'
    }
    setSigned(true)
    setShowSig(false)
  }

  const capture = async () => {
    const cv = await html2canvas(paperRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true })
    const imgData = cv.toDataURL('image/png')
    let pdf = null
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight()
      const iw = pw, ih = cv.height * pw / cv.width
      if (ih <= ph) doc.addImage(imgData, 'PNG', 0, 0, iw, ih)
      else { let pos = 0, rem = ih; while (rem > 0) { doc.addImage(imgData, 'PNG', 0, pos, iw, ih); rem -= ph; if (rem > 0) { doc.addPage(); pos -= ph } } }
      pdf = doc.output('datauristring')
    } catch { /* PDF 실패 시 이미지로 폴백 */ }
    return { pdf, img: pdf ? null : imgData }
  }

  const doSubmit = async () => {
    if (!signed) { alert('판매자 서명을 먼저 해주세요. 계약서의 "✍ 여기를 눌러 서명"을 눌러 서명하세요.'); return }
    if (sending) return
    setSending(true)
    let cap = { pdf: null, img: null }
    try { cap = await capture() } catch { /* 캡처 실패해도 전송은 진행(HTML 폴백) */ }
    try {
      await onSubmit({ pdf: cap.pdf, img: cap.img, contract_html: '<!doctype html><meta charset="utf-8">' + (paperRef.current?.outerHTML || '') })
      setDone(true)
    } catch { alert('전송에 실패했습니다. 네트워크 확인 후 다시 시도해주세요.'); setSending(false) }
  }

  const savePdf = async () => {
    try {
      const cv = await html2canvas(paperRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true })
      const imgData = cv.toDataURL('image/png')
      const doc = new jsPDF('p', 'mm', 'a4')
      const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight()
      const iw = pw, ih = cv.height * pw / cv.width
      if (ih <= ph) doc.addImage(imgData, 'PNG', 0, 0, iw, ih)
      else { let pos = 0, rem = ih; while (rem > 0) { doc.addImage(imgData, 'PNG', 0, pos, iw, ih); rem -= ph; if (rem > 0) { doc.addPage(); pos -= ph } } }
      doc.save(`매매계약서_${data.docNo}.pdf`)
    } catch { alert('PDF 저장에 실패했습니다.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-800/70">
      {/* 상단바 */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 shadow dark:bg-slate-900">
        <button onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 dark:border-slate-600 dark:text-slate-300">✕ 닫기</button>
        <div className="text-sm font-extrabold">매매계약서 작성</div>
        <div className="flex gap-1.5">
          <button onClick={savePdf} className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-2 text-xs font-bold text-indigo-600">PDF저장</button>
          <button onClick={doSubmit} disabled={sending} className={'rounded-lg px-3 py-2 text-sm font-extrabold text-white ' + (sending ? 'bg-slate-400' : 'bg-emerald-600 active:bg-emerald-700')}>{sending ? '전송 중…' : '✅ 신청 완료'}</button>
        </div>
      </div>

      {/* 안내 */}
      {!signed && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-[12px] font-semibold text-amber-700">계약서에서 <b>✍ 서명</b> 후 우측 상단 <b>[신청 완료]</b>를 눌러주세요.</div>
      )}

      {/* 계약서 종이 — 화면 폭에 맞춰 축소 표시(표 구조 유지), 캡처/PDF는 원본 760px */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-slate-200 p-3">
        <div style={{ width: fit.scale ? 760 * fit.scale : '100%', height: fit.h || undefined, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ width: 760, transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}>
            <div
              ref={paperRef}
              onClick={onPaperClick}
              className="hkc"
              style={{ background: '#fff', padding: '22px', width: 760, boxSizing: 'border-box', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}
              dangerouslySetInnerHTML={{ __html: paperHtml }}
            />
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>

      {/* 서명 패드 */}
      {showSig && <SignaturePad onSave={applySignature} onCancel={() => setShowSig(false)} />}

      {/* 완료 오버레이 */}
      {done && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/96 p-6 text-center">
          <div className="max-w-xs">
            <div className="text-2xl font-extrabold text-emerald-600">✅ 신청 완료</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">매매계약서가 HK 인터네셔널로 전송되었습니다.<br />담당자가 확인 후 연락드립니다.</p>
            <button onClick={onClose} className="mt-5 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white">확인</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 터치 서명 패드 ──
function SignaturePad({ onSave, onCancel }) {
  const cRef = useRef(null)
  const st = useRef({ drawing: false, has: false, last: null })
  useEffect(() => {
    const canvas = cRef.current, ctx = canvas.getContext('2d')
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'
    const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height } }
    const down = (e) => { const s = st.current; s.drawing = true; s.has = true; s.last = pt(e); try { canvas.setPointerCapture(e.pointerId) } catch (_) {} e.preventDefault() }
    const move = (e) => { const s = st.current; if (!s.drawing) return; const q = pt(e); ctx.beginPath(); ctx.moveTo(s.last.x, s.last.y); ctx.lineTo(q.x, q.y); ctx.stroke(); s.last = q; e.preventDefault() }
    const up = () => { st.current.drawing = false }
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointerleave', up)
    return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointerleave', up) }
  }, [])
  const clear = () => { const c = cRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); st.current.has = false }
  const save = () => { if (!st.current.has) { alert('서명해 주세요.'); return } onSave(cRef.current.toDataURL('image/png')) }
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4">
        <div className="mb-2 font-bold">판매자 서명 <span className="text-xs font-normal text-slate-400">· 손가락/펜으로 서명하세요</span></div>
        <canvas ref={cRef} width={600} height={260} style={{ width: '100%', height: 220, border: '2px dashed #bbb', borderRadius: 8, touchAction: 'none', background: '#fafafa', display: 'block' }} />
        <div className="mt-3 flex gap-2">
          <button onClick={clear} className="flex-1 rounded-lg bg-slate-100 py-3 text-sm font-bold text-slate-700">지우기</button>
          <button onClick={save} className="flex-[2] rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white">서명 완료</button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-bold text-slate-500">취소</button>
        </div>
      </div>
    </div>
  )
}
