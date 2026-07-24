<?php
// 컬럼 추가 마이그레이션. 1회 실행 후 삭제.
require_once __DIR__ . '/_common.php';
if (($_GET['key'] ?? '') !== 'hk-setup-9271') fail('no', 403);
$q = [
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(10) NULL AFTER buyer_account",
];
try { foreach ($q as $s) db()->exec($s); ok(['migrated' => true]); }
catch (Throwable $e) { fail('migrate 실패: ' . $e->getMessage(), 500); }
