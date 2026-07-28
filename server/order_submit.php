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

// ── 알림: 매매계약서 이메일(이미지 첨부) + 텔레그램 ──
$e = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
$sellerLabel = $shop ?: ($owner ?: '판매점');
$today = date('Y-m-d');
$contractHtml = (string) ($b['contract_html'] ?? '');
if (mb_strlen($contractHtml) > 800000) $contractHtml = '';

// 제목: 판매점_날짜_매매계약서
$subject = preg_replace('/[\r\n\t]/', ' ', $sellerLabel) . '_' . $today . '_매매계약서';

// 클라이언트가 캡처한 계약서 (PDF 우선, 없으면 PNG)
$attachments = [];
$attachKind = '';
$pdf = (string) ($b['contract_pdf'] ?? '');
$img = (string) ($b['contract_image'] ?? '');
if (strpos($pdf, 'data:application/pdf') === 0) {
  $bin = base64_decode(substr($pdf, strpos($pdf, ',') + 1));
  if ($bin !== false && strlen($bin) > 200) {
    $attachments[] = ['name' => 'contract_' . $docNo . '.pdf', 'mime' => 'application/pdf', 'data' => $bin];
    $attachKind = 'PDF';
  }
}
if (!$attachments && preg_match('#^data:image/png;base64,#', $img)) {
  $bin = base64_decode(substr($img, strpos($img, ',') + 1));
  if ($bin !== false && strlen($bin) > 200) {
    $attachments[] = ['name' => 'contract_' . $docNo . '.png', 'mime' => 'image/png', 'data' => $bin];
    $attachKind = '이미지';
  }
}

$summary = '<div style="font-family:sans-serif;font-size:14px">'
  . '<h2 style="color:#0c7a3b">📤 출고신청 매매계약서</h2>'
  . '<table cellpadding="5" style="border-collapse:collapse;font-size:14px">'
  . '<tr><td><b>판매점</b></td><td>' . $e($sellerLabel) . '</td></tr>'
  . '<tr><td><b>대표자</b></td><td>' . $e($owner ?: '-') . '</td></tr>'
  . '<tr><td><b>연락처</b></td><td>' . $e($store['phone'] ?? '-') . '</td></tr>'
  . '<tr><td><b>배송</b></td><td>' . ($delivery ?: '배송') . '</td></tr>'
  . '<tr><td><b>수량</b></td><td>' . $totalQty . '대</td></tr>'
  . '<tr><td><b>예상 매입가</b></td><td>' . number_format($totalWon) . '원</td></tr>'
  . '<tr><td><b>문서번호</b></td><td>' . $e($docNo) . ' (' . $today . ')</td></tr>'
  . '</table>';

if ($attachments) {
  $summary .= '<p style="margin-top:12px">📎 <b>서명된 매매계약서(' . $attachKind . ')</b>가 첨부되어 있습니다.</p></div>';
  notify_email($subject, $summary, $attachments);
} else {
  // 이미지 캡처 실패 시 계약서 HTML 을 본문에 포함
  $summary .= '<hr>' . ($contractHtml ?: '') . '</div>';
  notify_email($subject, $summary);
}

// 텔레그램: 간결하게 (새출고신청·택배/픽업 / 이름 / 몇대 예상매입가)
$deliveryLabel = $delivery ? $delivery . '신청' : '출고';
$tgName = $owner ?: ($shop ?: '판매자');
$tg = "📤 <b>새 출고신청</b> · " . $deliveryLabel . "\n"
  . $e($tgName) . "\n"
  . $totalQty . "대 · 예상매입가 " . number_format($totalWon) . "원";
notify_telegram($tg);

ok(['id' => $orderId, 'doc_no' => $docNo, 'saved' => true]);
