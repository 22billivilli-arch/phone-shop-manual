<?php
// inquiries 테이블 생성 (1회 실행 후 삭제)
require_once __DIR__ . '/_common.php';
if (($_GET['key'] ?? '') !== 'hk-setup-9271') fail('no', 403);
db()->exec("CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  company VARCHAR(120),
  country VARCHAR(80),
  contact VARCHAR(160) NOT NULL,
  interest VARCHAR(255),
  message MEDIUMTEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
ok(['created' => 'inquiries']);
