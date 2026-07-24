<?php
// DB 테이블 생성 (1회 실행 후 삭제). 접근키로 보호.
require_once __DIR__ . '/_common.php';
if (($_GET['key'] ?? '') !== 'hk-setup-9271') fail('unauthorized', 403);

$sql = [
"CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  phone VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  shop_name VARCHAR(120) NOT NULL,
  shop_addr VARCHAR(255) NOT NULL,
  id_card_file VARCHAR(120),
  bankbook_file VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_no VARCHAR(30) NOT NULL,
  member_id INT NULL,
  buyer_shop VARCHAR(120),
  buyer_owner VARCHAR(60),
  buyer_phone VARCHAR(30),
  buyer_addr VARCHAR(255),
  total_qty INT NOT NULL DEFAULT 0,
  total_won BIGINT NOT NULL DEFAULT 0,
  items_json MEDIUMTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX(member_id), INDEX(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];
try {
  foreach ($sql as $q) db()->exec($q);
  ok(['created' => ['members', 'orders']]);
} catch (Throwable $e) {
  fail('설치 실패: ' . $e->getMessage(), 500);
}
