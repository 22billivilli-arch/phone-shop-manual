// 시세 일일 이월: 금일→전일 자동 이월 + pending(신규 시세)→금일 적용
// 사용: 아침에 stage_pending.js 로 신규 시세를 pending 에 넣고, 4시(또는 원할 때) 이 스크립트 실행
const fs = require('fs');
const path = require('path').join(__dirname, '..', 'src', 'data', 'prices.json');
const p = JSON.parse(fs.readFileSync(path, 'utf8'));
if (!p.pendingModels || !p.pendingDate) { console.error('❌ 대기 중(pending) 시세가 없습니다. 먼저 신규 시세를 스테이징하세요.'); process.exit(1); }
// 금일 → 전일 이월
p.prevModels = p.models;
p.prevDate = p.baseDate;
// 신규 → 금일
p.models = p.pendingModels;
p.baseDate = p.pendingDate;
delete p.pendingModels;
delete p.pendingDate;
fs.writeFileSync(path, JSON.stringify(p, null, 1));
console.log(`✅ 이월 완료 — 전일 ${p.prevDate} → 금일 ${p.baseDate} (models ${p.models.length})`);
