<?php
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only');
$b = body_json();
$phone = preg_replace('/[^0-9]/', '', $b['phone'] ?? '');
$pw = (string) ($b['password'] ?? '');
if (!$phone || !$pw) fail('연락처와 비밀번호를 입력하세요.');

$stmt = db()->prepare('SELECT * FROM members WHERE phone=?');
$stmt->execute([$phone]);
$m = $stmt->fetch();
if (!$m || !password_verify($pw, $m['password_hash'])) fail('연락처 또는 비밀번호가 올바르지 않습니다.', 401);

$_SESSION['member_id'] = (int) $m['id'];
unset($_SESSION['is_admin']);
ok(['member' => ['id' => (int) $m['id'], 'name' => $m['name'], 'phone' => $m['phone'], 'shop_name' => $m['shop_name'], 'shop_addr' => $m['shop_addr']]]);
