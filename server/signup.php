<?php
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only');

$b = body_json();
$name  = trim($b['name'] ?? '');
$phone = preg_replace('/[^0-9]/', '', $b['phone'] ?? '');
$pw    = (string) ($b['password'] ?? '');
$shop  = trim($b['shop_name'] ?? '');
$addr  = trim($b['shop_addr'] ?? '');
$agree = !empty($b['agree']);
$idImg = $b['id_card'] ?? '';
$bkImg = $b['bankbook'] ?? '';

if ($name === '' || $shop === '' || $addr === '') fail('이름·매장명·매장주소를 모두 입력하세요.');
if (strlen($phone) < 9) fail('연락처를 정확히 입력하세요.');
if (strlen($pw) < 4) fail('비밀번호는 4자 이상으로 설정하세요.');
if (!$agree) fail('개인정보 수집·이용에 동의해야 가입할 수 있습니다.');
if (!$idImg) fail('주민등록증 사진을 첨부하세요.');
if (!$bkImg) fail('통장사본 사진을 첨부하세요.');

$exists = db()->prepare('SELECT id FROM members WHERE phone=?');
$exists->execute([$phone]);
if ($exists->fetch()) fail('이미 가입된 연락처입니다. 로그인해 주세요.');

$idFile = save_image($idImg, 'id');
$bkFile = save_image($bkImg, 'bank');

$stmt = db()->prepare('INSERT INTO members (name, phone, password_hash, shop_name, shop_addr, id_card_file, bankbook_file) VALUES (?,?,?,?,?,?,?)');
$stmt->execute([$name, $phone, password_hash($pw, PASSWORD_DEFAULT), $shop, $addr, $idFile, $bkFile]);

$id = (int) db()->lastInsertId();
$_SESSION['member_id'] = $id;
ok(['member' => ['id' => $id, 'name' => $name, 'phone' => $phone, 'shop_name' => $shop, 'shop_addr' => $addr]]);
