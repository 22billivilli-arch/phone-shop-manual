<?php
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only');
$b = body_json();
$u = (string) ($b['user'] ?? '');
$p = (string) ($b['password'] ?? '');
if (!hash_equals(ADMIN_USER, $u) || !hash_equals(ADMIN_PASS, $p)) {
  fail('관리자 아이디 또는 비밀번호가 올바르지 않습니다.', 401);
}
$_SESSION['is_admin'] = true;
unset($_SESSION['member_id']);
ok(['role' => 'admin', 'user' => ADMIN_USER]);
