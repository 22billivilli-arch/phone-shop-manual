<?php
// config.php 견본 — 실제 config.php는 서버(카페24)에만 두고 git에는 올리지 않음.
// 배포 시 이 파일을 config.php 로 복사하고 값을 채운다.

const DB_HOST = 'localhost';
const DB_NAME = 'YOUR_DB_NAME';
const DB_USER = 'YOUR_DB_USER';
const DB_PASS = 'YOUR_DB_PASSWORD';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'CHANGE_ME';

define('UPLOAD_DIR', __DIR__ . '/../uploads');

ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
date_default_timezone_set('Asia/Seoul');
