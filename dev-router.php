<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!is_string($path)) {
    http_response_code(400);
    exit;
}

$path = strtolower($path);
if (in_array($path, ['/config.php', '/config.local.php', '/db.php', '/auth_guard.php'], true) ||
    preg_match('~(?:^|/)\.[^/]*~', $path)) {
    http_response_code(403);
    exit;
}

if ($path === '/') {
    require __DIR__ . '/index.php';
    return true;
}

if (preg_match('~^/(index|login|admin|applications|drives|profile|seniors|student-dashboard)\.html$~', $path, $matches)) {
    require __DIR__ . '/' . $matches[1] . '.php';
    return true;
}

return false;
