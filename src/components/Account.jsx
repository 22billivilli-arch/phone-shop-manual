import { useEffect, useRef, useState } from 'react'
import { api, fileToDataURL } from '../lib/api'
import { won } from '../lib/hooks'

const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900'
const label = 'mb-1 block text-xs font-bold text-slate-500'
const btn = 'w-full rounded-xl py-3 text-sm font-extrabold text-white transition-colors'

export default function Account({ auth, setAuth, onAuthChange }) {
  // auth: {role:'guest'|'member'|'admin', member?, user?}
  if (!auth) return <div className="py-12 text-center text-sm text-slate-400">불러오는 중…</div>
  if (auth.role === 'admin') return <AdminPanel setAuth={setAuth} onAuthChange={onAuthChange} />
  if (auth.role === 'member') return <MemberHome member={auth.member} setAuth={setAuth} onAuthChange={onAuthChange} />
  return <GuestAuth onAuthChange={onAuthChange} />
}

// ── 비로그인: 로그인 / 회원가입 ──
function GuestAuth({ onAuthChange }) {
  const [mode, setMode] = useState('login') // login | signup | admin
  return (
    <div className="space-y-4">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {[['login', '로그인'], ['signup', '회원가입']].map(([k, t]) => (
          <button key={k} onClick={() => setMode(k)}
            className={'flex-1 rounded-lg py-2 text-sm font-bold ' + (mode === k ? 'bg-indigo-600 text-white' : 'text-slate-500')}>
            {t}
          </button>
        ))}
      </div>
      {mode === 'login' && <LoginForm onAuthChange={onAuthChange} onAdmin={() => setMode('admin')} />}
      {mode === 'signup' && <SignupForm onAuthChange={onAuthChange} />}
      {mode === 'admin' && <AdminLogin onAuthChange={onAuthChange} onBack={() => setMode('login')} />}
    </div>
  )
}

function LoginForm({ onAuthChange, onAdmin }) {
  const [phone, setPhone] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setErr(''); setBusy(true)
    try { await api.post('login.php', { phone, password: pw }); await onAuthChange() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-bold">거래처 로그인</h2>
      <div><label className={label}>연락처</label><input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="010-0000-0000" /></div>
      <div><label className={label}>비밀번호</label><input className={input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      {err && <p className="text-xs font-semibold text-rose-500">{err}</p>}
      <button className={btn + (busy ? ' bg-slate-400' : ' bg-indigo-600 active:bg-indigo-700')} onClick={submit} disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
      <button className="w-full text-center text-[11px] text-slate-400 underline" onClick={onAdmin}>관리자 로그인</button>
    </section>
  )
}

function AdminLogin({ onAuthChange, onBack }) {
  const [user, setUser] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setErr(''); setBusy(true)
    try { await api.post('admin_login.php', { user, password: pw }); await onAuthChange() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <section className="space-y-3 rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <h2 className="text-sm font-bold">🔐 관리자 로그인</h2>
      <div><label className={label}>아이디</label><input className={input} value={user} onChange={(e) => setUser(e.target.value)} /></div>
      <div><label className={label}>비밀번호</label><input className={input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      {err && <p className="text-xs font-semibold text-rose-500">{err}</p>}
      <button className={btn + (busy ? ' bg-slate-400' : ' bg-slate-800 active:bg-slate-900')} onClick={submit} disabled={busy}>{busy ? '확인 중…' : '관리자 로그인'}</button>
      <button className="w-full text-center text-[11px] text-slate-400 underline" onClick={onBack}>← 거래처 로그인</button>
    </section>
  )
}

function PhotoField({ title, hint, value, onPick }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  const pick = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { onPick(await fileToDataURL(f)) } catch (err) { alert(err.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <label className={label}>{title}</label>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <button type="button" onClick={() => ref.current.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-6 text-sm text-slate-500 dark:border-slate-700">
        {busy ? '처리 중…' : value ? <img src={value} alt="" className="max-h-28 rounded-lg" /> : <span>📷 {hint}</span>}
      </button>
      {value && <p className="mt-1 text-center text-[11px] text-emerald-600">✓ 첨부됨 · 다시 누르면 재촬영</p>}
    </div>
  )
}

function SignupForm({ onAuthChange }) {
  const [f, setF] = useState({ name: '', phone: '', password: '', shop_name: '', shop_addr: '' })
  const [idCard, setIdCard] = useState('')
  const [bankbook, setBankbook] = useState('')
  const [agree, setAgree] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = async () => {
    setErr(''); setBusy(true)
    try {
      await api.post('signup.php', { ...f, agree, id_card: idCard, bankbook })
      await onAuthChange()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-bold">거래처 회원가입</h2>
      <div><label className={label}>이름 (대표자)</label><input className={input} value={f.name} onChange={set('name')} /></div>
      <div><label className={label}>연락처 (로그인 아이디)</label><input className={input} value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="010-0000-0000" /></div>
      <div><label className={label}>비밀번호</label><input className={input} type="password" value={f.password} onChange={set('password')} /></div>
      <div><label className={label}>매장명</label><input className={input} value={f.shop_name} onChange={set('shop_name')} /></div>
      <div><label className={label}>매장 주소</label><input className={input} value={f.shop_addr} onChange={set('shop_addr')} /></div>
      <PhotoField title="주민등록증 사진" hint="주민등록증 촬영/첨부" value={idCard} onPick={setIdCard} />
      <PhotoField title="통장사본 사진" hint="통장사본 촬영/첨부" value={bankbook} onPick={setBankbook} />
      <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
        <span><b>[필수] 개인정보 수집·이용 동의</b><br />수집항목: 이름·연락처·매장정보·주민등록증·통장사본. 목적: 중고폰 매입 거래 및 정산·본인확인·장물방지. 보유: 거래 종료 후 관계법령에 따라 보관 후 파기. 사진은 비공개 저장되어 관리자만 열람합니다.</span>
      </label>
      {err && <p className="text-xs font-semibold text-rose-500">{err}</p>}
      <button className={btn + (busy ? ' bg-slate-400' : ' bg-indigo-600 active:bg-indigo-700')} onClick={submit} disabled={busy}>{busy ? '가입 중…' : '가입하기'}</button>
    </section>
  )
}

// ── 로그인한 거래처 ──
function MemberHome({ member, setAuth, onAuthChange }) {
  const logout = async () => { await api.post('logout.php', {}); await onAuthChange() }
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold">👤 {member.shop_name}</h2>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">거래처 회원</span>
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row k="대표자" v={member.name} />
          <Row k="연락처" v={member.phone} />
          <Row k="매장 주소" v={member.shop_addr} />
        </dl>
      </section>
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
        🧮 계산기에서 담아 <b>📤 출고 신청</b>하면 계약서에 위 정보가 자동 입력되고 매입 자료로 저장됩니다.
      </div>
      <button className={btn + ' bg-slate-200 !text-slate-600 dark:bg-slate-800 dark:!text-slate-300'} onClick={logout}>로그아웃</button>
    </div>
  )
}
function Row({ k, v }) {
  return <div className="flex gap-3"><dt className="w-16 flex-shrink-0 text-slate-400">{k}</dt><dd className="font-semibold">{v}</dd></div>
}

// ── 관리자 대시보드: 회원목록 / 출고내역 ──
function AdminPanel({ onAuthChange }) {
  const [tab, setTab] = useState('members')
  const logout = async () => { await api.post('logout.php', {}); await onAuthChange() }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold">🔐 관리자</h2>
        <button className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700" onClick={logout}>로그아웃</button>
      </div>
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {[['members', '회원 목록'], ['orders', '출고 내역']].map(([k, t]) => (
          <button key={k} onClick={() => setTab(k)}
            className={'flex-1 rounded-lg py-2 text-sm font-bold ' + (tab === k ? 'bg-indigo-600 text-white' : 'text-slate-500')}>{t}</button>
        ))}
      </div>
      {tab === 'members' ? <AdminMembers /> : <AdminOrders />}
    </div>
  )
}

function AdminMembers() {
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [photo, setPhoto] = useState(null) // {member, type}
  const load = async (kw = '') => { setRows(null); const r = await api.get('admin_members.php' + (kw ? '?q=' + encodeURIComponent(kw) : '')); setRows(r.members) }
  useEffect(() => { load() }, [])
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(q)} placeholder="🔍 이름·연락처·매장명" />
        <button className="rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white" onClick={() => load(q)}>검색</button>
      </div>
      {rows == null ? <p className="py-8 text-center text-sm text-slate-400">불러오는 중…</p> : (
        <>
          <p className="px-1 text-xs text-slate-500">총 <b>{rows.length}</b>명</p>
          <div className="space-y-2">
            {rows.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{m.shop_name} <span className="text-[11px] font-normal text-slate-400">/ {m.name}</span></div>
                    <div className="text-[11px] text-slate-500">{m.phone} · {m.shop_addr}</div>
                    <div className="text-[10px] text-slate-400">가입 {String(m.created_at).slice(0, 10)}</div>
                  </div>
                  <button className="text-slate-400" onClick={() => setSel(sel === m.id ? null : m.id)}>{sel === m.id ? '▲' : '▼'}</button>
                </div>
                {sel === m.id && (
                  <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <button className="flex-1 rounded-lg bg-slate-100 py-2 text-xs font-bold dark:bg-slate-800" onClick={() => setPhoto({ member: m.id, type: 'id' })} disabled={!m.has_id}>🪪 주민등록증 {m.has_id ? '' : '(없음)'}</button>
                    <button className="flex-1 rounded-lg bg-slate-100 py-2 text-xs font-bold dark:bg-slate-800" onClick={() => setPhoto({ member: m.id, type: 'bank' })} disabled={!m.has_bank}>🏦 통장사본 {m.has_bank ? '' : '(없음)'}</button>
                  </div>
                )}
              </div>
            ))}
            {rows.length === 0 && <p className="py-8 text-center text-sm text-slate-400">회원이 없습니다.</p>}
          </div>
        </>
      )}
      {photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPhoto(null)}>
          <div className="max-h-[90vh] max-w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img src={`/api/image.php?member=${photo.member}&type=${photo.type}`} alt="" className="max-h-[85vh] rounded-lg bg-white" />
            <button className="mt-2 w-full rounded-xl bg-white/90 py-2 text-sm font-bold" onClick={() => setPhoto(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminOrders() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  useEffect(() => { api.get('admin_orders.php').then((r) => setRows(r.orders)) }, [])
  if (rows == null) return <p className="py-8 text-center text-sm text-slate-400">불러오는 중…</p>
  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-slate-500">총 <b>{rows.length}</b>건</p>
      {rows.map((o) => (
        <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between" onClick={() => setOpen(open === o.id ? null : o.id)}>
            <div>
              <div className="text-sm font-bold">{o.buyer_shop || o.member_name || '(미지정)'} <span className="text-[11px] font-normal text-slate-400">{o.total_qty}대</span></div>
              <div className="text-[11px] text-slate-500">{o.doc_no} · {String(o.created_at).slice(0, 16).replace('T', ' ')}</div>
            </div>
            <div className="tnum text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{won(o.total_won)}원</div>
          </div>
          {open === o.id && (
            <div className="mt-2 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
              <div className="mb-1 text-slate-500">{o.buyer_owner} · {o.buyer_phone} · {o.buyer_addr}</div>
              {(o.items || []).map((it, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span>{it.name} {it.cap} <span className="text-slate-400">{it.gradeLabel}</span>{it.imei ? ' · ' + it.imei : ''} ×{it.qty}</span>
                  <span className="tnum">{won(Math.round((it.unit || 0) * 10000) * (it.qty || 1))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && <p className="py-8 text-center text-sm text-slate-400">출고 내역이 없습니다.</p>}
    </div>
  )
}
