<?php
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only');
$b = body_json();

$items = $b['items'] ?? [];
if (!is_array($items) || !count($items)) fail('출고 목록이 비어 있습니다.');

$memberId = !empty($_SESSION['member_id']) ? (int) $_SESSION['member_id'] : null;
$store = $b['store'] ?? [];
$docNo = preg_replace('/[^0-9\-]/', '', $b['doc_no'] ?? '') ?: date('YmdHis');

$totalQty = 0; $totalWon = 0;
foreach ($items as $it) {
  $qty = max(1, (int) ($it['qty'] ?? 1));
  $unit = (float) ($it['unit'] ?? 0);
  $totalQty += $qty;
  $totalWon += (int) round($unit * 10000) * $qty;
}

$stmt = db()->prepare('INSERT INTO orders (doc_no, member_id, buyer_shop, buyer_owner, buyer_phone, buyer_addr, total_qty, total_won, items_json) VALUES (?,?,?,?,?,?,?,?,?)');
$stmt->execute([
  $docNo, $memberId,
  trim($store['shop'] ?? ''), trim($store['owner'] ?? ''),
  preg_replace('/[^0-9]/', '', $store['phone'] ?? ''), trim($store['addr'] ?? ''),
  $totalQty, $totalWon, json_encode($items, JSON_UNESCAPED_UNICODE),
]);
ok(['id' => (int) db()->lastInsertId(), 'doc_no' => $docNo, 'saved' => true]);
