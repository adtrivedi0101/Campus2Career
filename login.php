<?php
require_once __DIR__ . '/auth_guard.php';
if (!empty($_SESSION['user'])) {
    header('Location: ' . ($_SESSION['user']['role'] === 'admin' ? 'admin.html' : 'student-dashboard.html'));
    exit;
}
include __DIR__ . '/login.html';
?>
