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

// ── 알림: 매매계약서 이메일 + 텔레그램 ──
$sellerLabel = $shop ?: ($owner ?: '판매점');
$today = date('Y-m-d');
$contractHtml = (string) ($b['contract_html'] ?? '');
if (mb_strlen($contractHtml) > 800000) $contractHtml = ''; // 과대 방지

// 제목: 판매점_날짜_매매계약서
$subjClean = preg_replace('/[\r\n\t]/', ' ', $sellerLabel);
$subject = $subjClean . '_' . $today . '_매매계약서';

if ($contractHtml !== '') {
  notify_email($subject, $contractHtml);
} else {
  // 계약서 HTML 미전송 시 요약본이라도 발송
  $e = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
  $rows = '';
  foreach ($items as $it) {
    $rows .= '<tr><td>' . $e($it['name'] ?? '') . '</td><td>' . $e($it['gradeLabel'] ?? '') . '</td><td>' . (int) ($it['qty'] ?? 1) . '</td></tr>';
  }
  $html = '<div style="font-family:sans-serif"><h2>출고신청 ' . $e($sellerLabel) . '</h2>'
    . '<p>' . ($delivery ?: '배송') . ' · ' . $totalQty . '대 · ' . number_format($totalWon) . '원</p>'
    . '<table border="1" cellpadding="4" style="border-collapse:collapse">' . $rows . '</table></div>';
  notify_email($subject, $html);
}

$tg = "📤 <b>새 출고신청</b> (" . ($delivery ?: '배송') . ")\n"
  . "🏪 " . htmlspecialchars($sellerLabel, ENT_QUOTES, 'UTF-8') . "\n"
  . "📱 " . $totalQty . "대 · 💰 " . number_format($totalWon) . "원\n"
  . "📄 문서 " . $docNo . " · 🕒 " . date('Y-m-d H:i');
notify_telegram($tg);

ok(['id' => $orderId, 'doc_no' => $docNo, 'saved' => true]);
