<?php
$localConfigPath = __DIR__ . '/config.local.php';
$localConfig = is_file($localConfigPath) ? require $localConfigPath : [];
if (!is_array($localConfig)) {
    throw new RuntimeException('config.local.php must return an array.');
}

$setting = static function (string $environmentVariable, string $key, string $default) use ($localConfig): string {
    $value = getenv($environmentVariable);
    if ($value === false) {
        $value = $localConfig[$key] ?? $default;
    }
    if (!is_string($value)) {
        throw new RuntimeException($key . ' in config.local.php must be a string.');
    }
    return $value;
};

define('DB_HOST', $setting('CAMPUS2CAREER_DB_HOST', 'DB_HOST', '127.0.0.1'));
define('DB_NAME', $setting('CAMPUS2CAREER_DB_NAME', 'DB_NAME', 'campus2career'));
define('DB_USER', $setting('CAMPUS2CAREER_DB_USER', 'DB_USER', 'root'));
define('DB_PASS', $setting('CAMPUS2CAREER_DB_PASS', 'DB_PASS', ''));
