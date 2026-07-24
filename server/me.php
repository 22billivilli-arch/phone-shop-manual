<?php
require_once __DIR__ . '/_common.php';
if (!empty($_SESSION['is_admin'])) {
  ok(['role' => 'admin', 'user' => ADMIN_USER]);
}
if (!empty($_SESSION['member_id'])) {
  $stmt = db()->prepare('SELECT id, name, phone, shop_name, shop_addr FROM members WHERE id=?');
  $stmt->execute([(int) $_SESSION['member_id']]);
  $m = $stmt->fetch();
  if ($m) ok(['role' => 'member', 'member' => $m]);
}
ok(['role' => 'guest']);
