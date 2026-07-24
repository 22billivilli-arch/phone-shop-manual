<?php
// 회원 사진(주민증/통장) 열람 — 관리자 세션에서만. 직접 URL 접근 방지.
require_once __DIR__ . '/_common.php';
require_admin();

$id = (int) ($_GET['member'] ?? 0);
$type = ($_GET['type'] ?? '') === 'bank' ? 'bankbook_file' : 'id_card_file';
$stmt = db()->prepare("SELECT $type AS f FROM members WHERE id=?");
$stmt->execute([$id]);
$row = $stmt->fetch();
if (!$row || !$row['f']) fail('이미지 없음', 404);

$path = UPLOAD_DIR . '/' . basename($row['f']);
if (!is_file($path)) fail('파일 없음', 404);

header_remove('Content-Type');
header('Content-Type: image/jpeg');
header('Cache-Control: private, no-store');
readfile($path);
exit;
