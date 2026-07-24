<?php
require_once __DIR__ . '/_common.php';
require_admin();
$stmt = db()->query(
  'SELECT o.id, o.doc_no, o.member_id, o.buyer_shop, o.buyer_owner, o.buyer_phone, o.buyer_addr,
          o.total_qty, o.total_won, o.items_json, o.created_at, m.name AS member_name
   FROM orders o LEFT JOIN members m ON m.id = o.member_id
   ORDER BY o.id DESC LIMIT 500'
);
$rows = $stmt->fetchAll();
foreach ($rows as &$r) {
  $r['items'] = json_decode($r['items_json'], true) ?: [];
  unset($r['items_json']);
}
ok(['count' => count($rows), 'orders' => $rows]);
