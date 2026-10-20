<?php
require_once __DIR__ . '/config.php';
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();
$_SESSION['setup_csrf'] = $_SESSION['setup_csrf'] ?? bin2hex(random_bytes(32));

$error = '';
$success = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['setup_csrf'], $_POST['csrf'] ?? '')) {
        http_response_code(403);
        exit('Setup form expired. Reload the page and try again.');
    }
    $name = trim($_POST['name'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    if (!preg_match('/^[\p{L}\p{M}][\p{L}\p{M} .\'-]{1,119}$/u', $name) ||
        !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 ||
        strlen($password) < 8 || strlen($password) > 72) {
        $error = 'Enter a valid name and email, and a password of 8-72 characters.';
    } else {
        try {
            $pdo = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', DB_NAME) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            $pdo->exec('USE `' . str_replace('`', '``', DB_NAME) . '`');
            $schema = [
                "CREATE TABLE IF NOT EXISTS users (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(120) NOT NULL, registration_number VARCHAR(20) NULL UNIQUE, department VARCHAR(80) NOT NULL DEFAULT '', email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role ENUM('student','admin') NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS profiles (user_id INT UNSIGNED PRIMARY KEY, phone VARCHAR(20) NULL, tenth_percent DECIMAL(5,2) NULL, twelfth_percent DECIMAL(5,2) NULL, cgpa DECIMAL(4,2) NULL, backlogs INT UNSIGNED NOT NULL DEFAULT 0, skills TEXT NULL, certifications TEXT NULL, resume_path VARCHAR(255) NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS companies (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE, sector VARCHAR(100) NOT NULL DEFAULT '') ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS drives (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id INT UNSIGNED NOT NULL, role VARCHAR(150) NOT NULL, package VARCHAR(80) NOT NULL DEFAULT '', min_cgpa DECIMAL(4,2) NOT NULL DEFAULT 0, max_backlogs INT UNSIGNED NOT NULL DEFAULT 0, drive_type ENUM('Full-time','Internship') NOT NULL DEFAULT 'Full-time', deadline DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE) ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS applications (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, drive_id INT UNSIGNED NOT NULL, status ENUM('Applied','Shortlisted','Interview','Selected','Rejected') NOT NULL DEFAULT 'Applied', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY one_application (user_id, drive_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE) ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS experiences (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, name VARCHAR(120) NOT NULL, batch CHAR(4) NOT NULL, company VARCHAR(150) NOT NULL, role VARCHAR(150) NOT NULL DEFAULT '', difficulty ENUM('Easy','Medium','Hard') NOT NULL, rating TINYINT UNSIGNED NOT NULL, experience TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS notifications (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, message TEXT NOT NULL, audience VARCHAR(40) NOT NULL DEFAULT 'All students', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, is_read TINYINT(1) NOT NULL DEFAULT 0) ENGINE=InnoDB",
                "CREATE TABLE IF NOT EXISTS notification_reads (notification_id INT UNSIGNED NOT NULL, user_id INT UNSIGNED NOT NULL, read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (notification_id, user_id), FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB"
            ];
            foreach ($schema as $sql) $pdo->exec($sql);
            $existing = $pdo->prepare("SELECT id FROM users WHERE role='admin' LIMIT 1");
            $existing->execute();
            if ($existing->fetch()) {
                $error = 'The database is already initialized with an admin account. Use the login page.';
            } else {
                $insert = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'admin')");
                $insert->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
                $success = true;
            }
        } catch (Throwable $exception) {
            error_log('Campus2Career setup error: ' . $exception->getMessage());
            $error = 'Could not connect or initialize the database. Check config.php and confirm MySQL is running.';
        }
    }
}
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Campus2Career setup</title><link rel="stylesheet" href="css/style.css?v=4"></head>
<body><main class="container" style="max-width:620px;padding-top:48px">
<section class="card">
<h1>Campus2Career setup</h1>
<?php if ($success): ?>
<p class="badge b-green">Setup complete</p><p>Your database is ready and the administrator account has been created.</p>
<a class="btn" href="login.html">Go to login</a>
<p class="lead">For safety, remove or rename <strong>setup.php</strong> after confirming login.</p>
<?php else: ?>
<p class="lead">Create the MySQL tables and the first administrator account. This only works before an admin account exists.</p>
<?php if ($error !== ''): ?><p class="error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
<form method="post">
<input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['setup_csrf'], ENT_QUOTES, 'UTF-8') ?>">
<div class="form-group"><label for="name">Administrator name</label><input id="name" name="name" required minlength="2" maxlength="120" pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,119}" autocomplete="name"></div>
<div class="form-group"><label for="email">Administrator email</label><input id="email" name="email" type="email" maxlength="190" autocomplete="email" required></div>
<div class="form-group"><label for="password">Password (8-72 characters)</label><input id="password" name="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
<button class="btn" type="submit">Initialize database</button></form>
<?php endif; ?>
</section></main></body></html>
