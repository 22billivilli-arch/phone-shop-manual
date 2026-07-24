<?php
require_once __DIR__ . '/_common.php';
require_admin();
$q = trim($_GET['q'] ?? '');
if ($q !== '') {
  $like = '%' . $q . '%';
  $stmt = db()->prepare('SELECT id, name, phone, shop_name, shop_addr, id_card_file, bankbook_file, status, created_at FROM members WHERE name LIKE ? OR phone LIKE ? OR shop_name LIKE ? ORDER BY id DESC');
  $stmt->execute([$like, $like, $like]);
} else {
  $stmt = db()->query('SELECT id, name, phone, shop_name, shop_addr, id_card_file, bankbook_file, status, created_at FROM members ORDER BY id DESC');
}
$rows = $stmt->fetchAll();
foreach ($rows as &$r) {
  $r['has_id'] = !empty($r['id_card_file']);
  $r['has_bank'] = !empty($r['bankbook_file']);
  unset($r['id_card_file'], $r['bankbook_file']);
}
ok(['count' => count($rows), 'members' => $rows]);
