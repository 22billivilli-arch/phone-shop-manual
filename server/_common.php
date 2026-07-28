<?php
// 공통: DB 연결, JSON 응답, 세션, 인증 헬퍼
require_once __DIR__ . '/config.php';

session_start();
header('Content-Type: application/json; charset=utf-8');

function db() {
  static $pdo = null;
  if ($pdo === null) {
    $pdo = new PDO(
      'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
      DB_USER, DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
  }
  return $pdo;
}

function body_json() {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}

function ok($data = []) { echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE); exit; }
function fail($msg, $code = 400) { http_response_code($code); echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE); exit; }

function require_member() {
  if (empty($_SESSION['member_id'])) fail('로그인이 필요합니다.', 401);
  return (int) $_SESSION['member_id'];
}
function require_admin() {
  if (empty($_SESSION['is_admin'])) fail('관리자 권한이 필요합니다.', 403);
}

// ── 알림 ── (실패해도 요청 흐름을 막지 않음)
function notify_email($subject, $html) {
  if (!defined('NOTIFY_EMAIL') || !NOTIFY_EMAIL) return false;
  $enc = '=?UTF-8?B?' . base64_encode($subject) . '?=';
  $headers = "MIME-Version: 1.0\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\n"
    . 'From: HK 인터네셔널 <' . MAIL_FROM . ">\r\n"
    . 'Reply-To: ' . MAIL_FROM . "\r\n";
  return @mail(NOTIFY_EMAIL, $enc, $html, $headers, '-f' . MAIL_FROM);
}

function notify_telegram($text) {
  if (!defined('TELEGRAM_BOT_TOKEN') || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  $url = 'https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage';
  $payload = http_build_query([
    'chat_id' => TELEGRAM_CHAT_ID,
    'text' => $text,
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => 'true',
  ]);
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_SSL_VERIFYPEER => false,
  ]);
  $res = curl_exec($ch);
  curl_close($ch);
  return $res;
}

// base64 dataURL 또는 업로드 이미지 → 리사이즈·압축 후 저장, 파일명 반환
function save_image($dataUrl, $prefix) {
  if (!$dataUrl || !preg_match('#^data:image/(\w+);base64,#', $dataUrl, $m)) {
    fail('이미지 형식 오류: ' . $prefix);
  }
  $bin = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1));
  if ($bin === false || strlen($bin) < 100) fail('이미지 디코딩 실패: ' . $prefix);
  $src = @imagecreatefromstring($bin);
  if (!$src) fail('이미지를 읽을 수 없습니다: ' . $prefix);

  $w = imagesx($src); $h = imagesy($src);
  $max = 1400;
  $scale = min(1, $max / max($w, $h));
  $nw = max(1, (int) round($w * $scale)); $nh = max(1, (int) round($h * $scale));
  $dst = imagecreatetruecolor($nw, $nh);
  imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

  if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0700, true);
  $name = $prefix . '_' . date('Ymd') . '_' . bin2hex(random_bytes(8)) . '.jpg';
  $path = UPLOAD_DIR . '/' . $name;
  imagejpeg($dst, $path, 72);
  imagedestroy($src); imagedestroy($dst);
  return $name;
}
