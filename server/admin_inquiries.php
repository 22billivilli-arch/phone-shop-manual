<?php
// 관리자: 바이어 문의 목록
require_once __DIR__ . '/_common.php';
require_admin();
$rows = db()->query('SELECT id, name, company, country, contact, interest, message, created_at FROM inquiries ORDER BY id DESC LIMIT 500')->fetchAll();
ok(['count' => count($rows), 'inquiries' => $rows]);
