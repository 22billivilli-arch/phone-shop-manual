<?php
// 해외 바이어 문의 접수 (공개 POST)
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only');
$b = body_json();
$name     = trim($b['name'] ?? '');
$company  = trim($b['company'] ?? '');
$country  = trim($b['country'] ?? '');
$contact  = trim($b['contact'] ?? '');   // email or messenger
$interest = trim($b['interest'] ?? '');  // models / quantity
$message  = trim($b['message'] ?? '');

if ($name === '' || $contact === '') fail('Please enter your name and contact.');
if (mb_strlen($message) > 4000) $message = mb_substr($message, 0, 4000);

$stmt = db()->prepare('INSERT INTO inquiries (name, company, country, contact, interest, message) VALUES (?,?,?,?,?,?)');
$stmt->execute([$name, $company, $country, $contact, $interest, $message]);
$id = (int) db()->lastInsertId();

// ── 알림 ──
$e = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
$when = date('Y-m-d H:i');
$emailHtml = '<div style="font-family:sans-serif;max-width:560px">'
  . '<h2 style="color:#0c7a3b">🌏 새 해외 바이어 문의 #' . $id . '</h2>'
  . '<table cellpadding="6" style="border-collapse:collapse;font-size:14px">'
  . '<tr><td><b>이름</b></td><td>' . $e($name) . '</td></tr>'
  . '<tr><td><b>회사</b></td><td>' . $e($company ?: '-') . '</td></tr>'
  . '<tr><td><b>국가</b></td><td>' . $e($country ?: '-') . '</td></tr>'
  . '<tr><td><b>연락처</b></td><td>' . $e($contact) . '</td></tr>'
  . '<tr><td><b>관심품목</b></td><td>' . $e($interest ?: '-') . '</td></tr>'
  . '<tr><td valign="top"><b>메시지</b></td><td>' . nl2br($e($message)) . '</td></tr>'
  . '<tr><td><b>접수시각</b></td><td>' . $when . '</td></tr>'
  . '</table><p style="color:#888;font-size:12px">HK 인터네셔널 · 수출 페이지 문의</p></div>';
notify_email('[HK 수출문의] ' . $name . ($company ? ' / ' . $company : ''), $emailHtml);

$tg = "🌏 <b>새 해외 바이어 문의</b> #$id\n"
  . "👤 " . $e($name) . ($company ? " / " . $e($company) : "") . "\n"
  . ($country ? "🏳 " . $e($country) . "\n" : "")
  . "✉ " . $e($contact) . "\n"
  . ($interest ? "🔎 " . $e($interest) . "\n" : "")
  . ($message ? "💬 " . $e(mb_substr($message, 0, 500)) . "\n" : "")
  . "🕒 $when";
notify_telegram($tg);

ok(['id' => $id]);
