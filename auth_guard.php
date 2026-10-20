<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
    ]);
    session_start();
}

function require_login(?string $role = null): void
{
    if (empty($_SESSION['user'])) {
        header('Location: login.html');
        exit;
    }
    if ($role !== null && $_SESSION['user']['role'] !== $role) {
        header('Location: ' . ($_SESSION['user']['role'] === 'admin' ? 'admin.html' : 'student-dashboard.html'));
        exit;
    }
}
