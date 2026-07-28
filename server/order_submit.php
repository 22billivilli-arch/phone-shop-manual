<?php
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only');
$b = body_json();

$items = $b['items'] ?? [];
if (!is_array($items) || !count($items)) fail('출고 목록이 비어 있습니다.');

$memberId = !empty($_SESSION['member_id']) ? (int) $_SESSION['member_id'] : null;
$store = $b['store'] ?? [];
$docNo = preg_replace('/[^0-9\-]/', '', $b['doc_no'] ?? '') ?: date('YmdHis');
$delivery = in_array($b['delivery_type'] ?? '', ['택배', '픽업'], true) ? $b['delivery_type'] : '';

$totalQty = 0; $totalWon = 0;
foreach ($items as $it) {
  $qty = max(1, (int) ($it['qty'] ?? 1));
  $unit = (float) ($it['unit'] ?? 0);
  $totalQty += $qty;
  $totalWon += (int) round($unit * 10000) * $qty;
}

$shop = trim($store['shop'] ?? '');
$owner = trim($store['owner'] ?? '');

$stmt = db()->prepare('INSERT INTO orders (doc_no, member_id, buyer_shop, buyer_owner, buyer_phone, buyer_addr, buyer_bank, buyer_account, delivery_type, total_qty, total_won, items_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
$stmt->execute([
  $docNo, $memberId,
  $shop, $owner,
  preg_replace('/[^0-9]/', '', $store['phone'] ?? ''), trim($store['addr'] ?? ''),
  trim($store['bank'] ?? ''), trim($store['account'] ?? ''), $delivery,
  $totalQty, $totalWon, json_encode($items, JSON_UNESCAPED_UNICODE),
]);
$orderId = (int) db()->lastInsertId();

// ── 알림: 서버가 매매계약서 HTML 생성 → 메일(서명 CID 인라인) + 텔레그램 ──
$e = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
$sellerLabel = $shop ?: ($owner ?: '판매점');
$today = date('Y-m-d');
$subject = preg_replace('/[\r\n\t]/', ' ', $sellerLabel) . '_' . $today . '_매매계약서';

// 서명 이미지 → CID 인라인
$inline = [];
$sig = (string) ($b['signature'] ?? '');
$sigTag = '<span style="color:#999">(서명)</span>';
if (preg_match('#^data:image/(png|jpe?g);base64,#', $sig, $sm)) {
  $bin = base64_decode(substr($sig, strpos($sig, ',') + 1));
  if ($bin !== false && strlen($bin) > 100 && strlen($bin) < 400000) {
    $inline[] = ['cid' => 'sellersig', 'mime' => ($sm[1] === 'png' ? 'image/png' : 'image/jpeg'), 'data' => $bin];
    $sigTag = '<img src="cid:sellersig" alt="서명" style="height:46px;vertical-align:middle">';
  }
}

// 계약서 표 행
$td = 'style="border:1px solid #999;padding:6px 5px;font-size:12px"';
$tdc = 'style="border:1px solid #999;padding:6px 5px;font-size:12px;text-align:center"';
$tdr = 'style="border:1px solid #999;padding:6px 5px;font-size:12px;text-align:right"';
$rowsHtml = '';
$i = 0;
foreach ($items as $it) {
  $i++;
  $unitWon = (int) round(((float) ($it['unit'] ?? 0)) * 10000);
  $amt = $unitWon * max(1, (int) ($it['qty'] ?? 1));
  $rowsHtml .= "<tr>"
    . "<td $tdc>$i</td>"
    . "<td $td>" . $e(trim(($it['brand'] ?? '') . ' ' . ($it['name'] ?? ''))) . "</td>"
    . "<td $tdc>" . $e($it['cap'] ?? '') . "</td>"
    . "<td $tdc>" . $e($it['gradeLabel'] ?? '') . "</td>"
    . "<td $tdc>" . $e($it['imei'] ?? '-') . "</td>"
    . "<td $tdc>" . (int) ($it['qty'] ?? 1) . "</td>"
    . "<td $tdr>" . number_format($unitWon) . "</td>"
    . "<td $tdr>" . number_format($amt) . "</td>"
    . "</tr>";
}
$acct = trim(($store['bank'] ?? '') . ' ' . ($store['account'] ?? ''));
$box = 'style="border:1px solid #333;border-radius:6px;padding:10px 12px;vertical-align:top;width:50%"';
$delivLine = $delivery === '픽업'
  ? '🏠 방문 픽업 · HK 인터네셔널이 방문 수거 (방문 시간 문자 안내)'
  : ($delivery === '택배' ? '🚚 택배 발송 · 발송지: 대구 달서구 송현동 1036-8 4층 HK 인터네셔널 010-3770-7254' : '배송');

$html = '<div style="font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;color:#111;max-width:720px;margin:0 auto;padding:12px">'
  . '<h1 style="text-align:center;font-size:22px;letter-spacing:6px;margin:0 0 4px">중고폰 매매계약서</h1>'
  . '<div style="text-align:center;color:#666;font-size:11px;margin-bottom:16px">문서번호 ' . $e($docNo) . ' · 작성일 ' . $today . '</div>'
  . '<table style="width:100%;border-collapse:separate;border-spacing:12px 0;margin-bottom:14px"><tr>'
  . '<td ' . $box . '><div style="font-size:12px;color:#444;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:6px"><b>매입자 (갑)</b></div>'
  . '<div style="font-size:12px;line-height:1.7"><b style="color:#666">상호</b> HK 인터네셔널<br><b style="color:#666">연락처</b> 010-3770-7254<br><b style="color:#666">주소</b> 대구 달서구 송현동 1036-8, 4층</div></td>'
  . '<td ' . $box . '><div style="font-size:12px;color:#444;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:6px"><b>판매자 (을)</b></div>'
  . '<div style="font-size:12px;line-height:1.7"><b style="color:#666">매장명</b> ' . ($e($shop) ?: '-') . '<br><b style="color:#666">대표자</b> ' . ($e($owner) ?: '-') . '<br><b style="color:#666">연락처</b> ' . ($e($store['phone'] ?? '') ?: '-') . '<br><b style="color:#666">주소</b> ' . ($e($store['addr'] ?? '') ?: '-') . '<br><b style="color:#666">정산계좌</b> ' . ($e($acct) ?: '-') . '</div></td>'
  . '</tr></table>'
  . '<div style="font-size:12px;background:#f4f6ff;border:1px solid #ccd4ff;border-radius:6px;padding:8px 12px;margin-bottom:12px"><b>' . $delivLine . '</b></div>'
  . '<table style="width:100%;border-collapse:collapse;margin-bottom:10px">'
  . "<thead><tr>"
  . "<th $tdc style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">No</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">모델</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">용량</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">등급</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">IMEI</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">수량</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">단가(원)</th>"
  . "<th style=\"background:#f0f0f0;border:1px solid #999;padding:6px 5px;font-size:12px\">금액(원)</th>"
  . "</tr></thead><tbody>" . $rowsHtml . "</tbody>"
  . "<tfoot><tr>"
  . "<td colspan=\"5\" $tdr style=\"border:1px solid #999;padding:6px 5px;font-size:12px;text-align:right;font-weight:bold;background:#fafafa\">합계</td>"
  . "<td $tdc style=\"border:1px solid #999;padding:6px 5px;font-size:12px;text-align:center;font-weight:bold;background:#fafafa\">$totalQty</td>"
  . "<td style=\"border:1px solid #999;background:#fafafa\"></td>"
  . "<td $tdr style=\"border:1px solid #999;padding:6px 5px;font-size:12px;text-align:right;font-weight:bold;background:#fafafa\">" . number_format($totalWon) . "</td>"
  . "</tr></tfoot></table>"
  . '<div style="font-size:11px;color:#444;line-height:1.7;border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin-bottom:18px">'
  . '1. 을은 위 기기가 <b>분실·도난·할부금 미납 기기가 아님</b>을 보증하며, 사후 문제 발생 시 을이 책임진다.<br>'
  . '2. 매입 단가는 검수 완료 후 등급·상태에 따라 조정될 수 있으며, 최종 금액은 검수 후 확정한다.<br>'
  . '3. 대금은 검수 완료 후 을이 지정한 계좌로 지급한다.<br>'
  . '4. 기기의 데이터 초기화 및 계정(iCloud·Google) 잠금 해제는 을의 책임으로 한다.<br>'
  . '5. 본 계약서는 매입 자료로 보관되며, 상기 내용에 상호 동의한다.</div>'
  . '<table style="width:100%;margin-top:20px"><tr>'
  . '<td style="font-size:12px">매입자(갑) HK 인터네셔널 <span style="display:inline-block;width:46px;height:46px;border:1px dashed #bbb;border-radius:50%;text-align:center;line-height:46px;color:#bbb;font-size:10px;vertical-align:middle">직인</span></td>'
  . '<td style="font-size:12px;text-align:right">판매자(을) ' . ($e($owner) ?: '') . ' ' . $sigTag . ' (인)</td>'
  . '</tr></table>'
  . '<div style="text-align:center;margin-top:14px;color:#888;font-size:11px">' . $today . '</div>'
  . '</div>';

notify_email_related($subject, $html, $inline);

// 텔레그램: 간결하게 (새출고신청·택배/픽업 / 이름 / 몇대 예상매입가)
$deliveryLabel = $delivery ? $delivery . '신청' : '출고';
$tgName = $owner ?: ($shop ?: '판매자');
$tg = "📤 <b>새 출고신청</b> · " . $deliveryLabel . "\n"
  . $e($tgName) . "\n"
  . $totalQty . "대 · 예상매입가 " . number_format($totalWon) . "원";
notify_telegram($tg);

ok(['id' => $orderId, 'doc_no' => $docNo, 'saved' => true]);
