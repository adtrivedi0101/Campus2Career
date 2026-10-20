<?php
require_once __DIR__ . '/auth_guard.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

function respond($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function input_data(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    return is_array($body) ? $body : $_POST;
}

function text_value($value): string
{
    return is_string($value) ? trim($value) : '';
}

function valid_name(string $value): bool
{
    return (bool)preg_match('/^[\p{L}\p{M}][\p{L}\p{M} .\'-]{1,119}$/u', $value);
}

function signed_in(): array
{
    if (empty($_SESSION['user'])) {
        respond(['error' => 'Please log in to continue.'], 401);
    }
    return $_SESSION['user'];
}

function require_role(string $role): array
{
    $user = signed_in();
    if ($user['role'] !== $role) {
        respond(['error' => 'You do not have permission to do that.'], 403);
    }
    return $user;
}

function require_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $token)) {
        respond(['error' => 'Your session token has expired. Refresh and try again.'], 403);
    }
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$data = input_data();

try {
    if ($action === 'login' && $method === 'POST') {
        $email = strtolower(text_value($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 ||
            !is_string($password) || strlen($password) < 8 || strlen($password) > 72 ||
            !in_array($role, ['student', 'admin'], true)) {
            respond(['error' => 'Enter a valid email, password, and account type.'], 422);
        }
        $statement = db()->prepare('SELECT id, full_name, email, role, password_hash FROM users WHERE email = ? AND role = ?');
        $statement->execute([$email, $role]);
        $user = $statement->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            respond(['error' => 'Email or password is incorrect.'], 401);
        }
        session_regenerate_id(true);
        unset($user['password_hash']);
        $_SESSION['user'] = $user;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        respond(['user' => $user, 'csrf' => $_SESSION['csrf']]);
    }

    if ($action === 'register' && $method === 'POST') {
        $name = text_value($data['name'] ?? '');
        $reg = strtoupper(text_value($data['registration_number'] ?? ''));
        $department = text_value($data['department'] ?? '');
        $email = strtolower(text_value($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        if (!valid_name($name) || !preg_match('/^[A-Z0-9-]{4,20}$/', $reg) ||
            !in_array($department, ['CSE', 'IT', 'ECE', 'MCA', 'Mechanical'], true) ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 ||
            !is_string($password) || strlen($password) < 8 || strlen($password) > 72) {
            respond(['error' => 'Check your details. Use a valid registration number and a password of at least 8 characters.'], 422);
        }
        db()->beginTransaction();
        $statement = db()->prepare('INSERT INTO users (full_name, registration_number, department, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)');
        try {
            $statement->execute([$name, $reg, $department, $email, password_hash($password, PASSWORD_DEFAULT), 'student']);
            $id = (int)db()->lastInsertId();
            db()->prepare('INSERT INTO profiles (user_id) VALUES (?)')->execute([$id]);
            db()->commit();
        } catch (PDOException $error) {
            db()->rollBack();
            if ($error->getCode() === '23000') {
                respond(['error' => 'That email or registration number is already registered.'], 409);
            }
            throw $error;
        }
        respond(['message' => 'Account created. You can now log in.'], 201);
    }

    if ($action === 'session' && $method === 'GET') {
        $user = signed_in();
        $_SESSION['csrf'] = $_SESSION['csrf'] ?? bin2hex(random_bytes(32));
        respond(['user' => $user, 'csrf' => $_SESSION['csrf']]);
    }

    if ($action === 'logout' && $method === 'POST') {
        signed_in();
        require_csrf();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        respond(['message' => 'Logged out.']);
    }

    $user = signed_in();
    if ($method !== 'GET') {
        require_csrf();
    }

    if ($action === 'profile' && $method === 'GET') {
        $statement = db()->prepare('SELECT u.full_name, u.registration_number, u.department, u.email, p.phone, p.tenth_percent, p.twelfth_percent, p.cgpa, p.backlogs, p.skills, p.certifications, (p.resume_path IS NOT NULL) AS resume_uploaded FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ?');
        $statement->execute([$user['id']]);
        respond($statement->fetch());
    }

    if ($action === 'resume' && $method === 'POST') {
        require_role('student');
        $file = $_FILES['resume'] ?? null;
        if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] > 2 * 1024 * 1024 || !is_uploaded_file($file['tmp_name'])) {
            respond(['error' => 'Choose a PDF file smaller than 2 MB.'], 422);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $signature = file_get_contents($file['tmp_name'], false, null, 0, 5);
        if ($mime !== 'application/pdf' || $signature !== '%PDF-') {
            respond(['error' => 'The uploaded file is not a valid PDF.'], 422);
        }
        $directory = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'resumes';
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            error_log('Campus2Career could not create resume storage.');
            respond(['error' => 'Resume storage is unavailable.'], 500);
        }
        $filename = bin2hex(random_bytes(16)) . '.pdf';
        $path = $directory . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            respond(['error' => 'Resume could not be saved. Check folder permissions.'], 500);
        }
        $statement = db()->prepare('SELECT resume_path FROM profiles WHERE user_id=?');
        $statement->execute([$user['id']]);
        $previous = $statement->fetchColumn();
        db()->prepare('UPDATE profiles SET resume_path=? WHERE user_id=?')->execute([$filename, $user['id']]);
        if (is_string($previous) && preg_match('/^[a-f0-9]{32}\.pdf$/', $previous)) {
            $oldPath = $directory . DIRECTORY_SEPARATOR . $previous;
            if (is_file($oldPath)) unlink($oldPath);
        }
        respond(['message' => 'Resume uploaded.']);
    }

    if ($action === 'resume-download' && $method === 'GET') {
        require_role('student');
        $statement = db()->prepare('SELECT resume_path FROM profiles WHERE user_id=?');
        $statement->execute([$user['id']]);
        $filename = $statement->fetchColumn();
        if (!is_string($filename) || !preg_match('/^[a-f0-9]{32}\.pdf$/', $filename)) {
            respond(['error' => 'No resume is available.'], 404);
        }
        $path = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'resumes' . DIRECTORY_SEPARATOR . $filename;
        if (!is_file($path)) respond(['error' => 'Saved resume file is missing.'], 404);
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="resume.pdf"');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }

    if ($action === 'profile' && $method === 'POST') {
        require_role('student');
        $backlogs = $data['backlogs'] ?? '0';
        $tenth = $data['tenth_percent'] ?? '';
        $twelfth = $data['twelfth_percent'] ?? '';
        $cgpa = $data['cgpa'] ?? '';
        $skills = $data['skills'] ?? [];
        $certifications = $data['certifications'] ?? [];
        if (!is_string($data['phone'] ?? '') || !is_array($skills) || !is_array($certifications) ||
            count($skills) > 50 || count($certifications) > 50 ||
            count(array_filter($skills, 'is_string')) !== count($skills) ||
            count(array_filter($certifications, 'is_string')) !== count($certifications) ||
            count(array_filter($skills, static fn($item) => trim($item) !== '' && mb_strlen(trim($item)) <= 60)) !== count($skills) ||
            count(array_filter($certifications, static fn($item) => trim($item) !== '' && mb_strlen(trim($item)) <= 150)) !== count($certifications) ||
            ($tenth !== '' && (!is_numeric($tenth) || $tenth < 0 || $tenth > 100)) ||
            ($twelfth !== '' && (!is_numeric($twelfth) || $twelfth < 0 || $twelfth > 100)) ||
            ($cgpa !== '' && (!is_numeric($cgpa) || $cgpa < 0 || $cgpa > 10)) ||
            !ctype_digit((string)$backlogs) || (int)$backlogs > 100) {
            respond(['error' => 'Check your academic values, skills, and certifications.'], 422);
        }
        $values = [
            text_value($data['phone'] ?? ''),
            $tenth === '' ? null : $tenth,
            $twelfth === '' ? null : $twelfth,
            $cgpa === '' ? null : $cgpa,
            $backlogs,
            json_encode(array_values($skills), JSON_UNESCAPED_UNICODE),
            json_encode(array_values($certifications), JSON_UNESCAPED_UNICODE),
            $user['id'],
        ];
        if (!preg_match('/^[6-9][0-9]{9}$/', $values[0])) {
            respond(['error' => 'Enter a valid 10-digit mobile number.'], 422);
        }
        db()->prepare('UPDATE profiles SET phone=?, tenth_percent=?, twelfth_percent=?, cgpa=?, backlogs=?, skills=?, certifications=? WHERE user_id=?')->execute($values);
        respond(['message' => 'Profile saved.']);
    }

    if ($action === 'drives' && $method === 'GET') {
        require_role('student');
        $statement = db()->prepare('SELECT d.id, c.name AS company, c.sector, d.role, d.package, d.min_cgpa, d.max_backlogs, d.drive_type, d.deadline, EXISTS(SELECT 1 FROM applications a WHERE a.drive_id=d.id AND a.user_id=?) AS applied FROM drives d JOIN companies c ON c.id=d.company_id WHERE d.deadline >= CURDATE() ORDER BY d.deadline');
        $statement->execute([$user['id']]);
        $rows = $statement->fetchAll();
        respond($rows);
    }

    if ($action === 'apply' && $method === 'POST') {
        require_role('student');
        $driveId = filter_var($data['drive_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($driveId === false) respond(['error' => 'Select a valid placement drive.'], 422);
        $profile = db()->prepare('SELECT cgpa, backlogs FROM profiles WHERE user_id=?');
        $profile->execute([$user['id']]);
        $student = $profile->fetch();
        $drive = db()->prepare('SELECT min_cgpa, max_backlogs, deadline FROM drives WHERE id=?');
        $drive->execute([$driveId]);
        $criteria = $drive->fetch();
        if (!$criteria || strtotime($criteria['deadline']) < strtotime('today')) {
            respond(['error' => 'This drive is unavailable or its deadline has passed.'], 422);
        }
        if ($student['cgpa'] === null || $student['cgpa'] < $criteria['min_cgpa'] || $student['backlogs'] > $criteria['max_backlogs']) {
            respond(['error' => 'Your profile does not meet this drive’s eligibility criteria.'], 422);
        }
        try {
            db()->prepare('INSERT INTO applications (user_id, drive_id) VALUES (?, ?)')->execute([$user['id'], $driveId]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                respond(['error' => 'You have already applied to this drive.'], 409);
            }
            throw $error;
        }
        respond(['message' => 'Application submitted.'], 201);
    }

    if ($action === 'applications' && $method === 'GET') {
        if ($user['role'] === 'admin') {
            $rows = db()->query('SELECT a.id, u.full_name AS student, u.email, p.cgpa, c.name AS company, d.role, a.status, a.created_at FROM applications a JOIN users u ON u.id=a.user_id JOIN profiles p ON p.user_id=u.id JOIN drives d ON d.id=a.drive_id JOIN companies c ON c.id=d.company_id ORDER BY a.created_at DESC')->fetchAll();
        } else {
            $statement = db()->prepare('SELECT a.id, c.name AS company, d.role, a.status, a.created_at FROM applications a JOIN drives d ON d.id=a.drive_id JOIN companies c ON c.id=d.company_id WHERE a.user_id=? ORDER BY a.created_at DESC');
            $statement->execute([$user['id']]);
            $rows = $statement->fetchAll();
        }
        respond($rows);
    }

    if ($action === 'companies' && $method === 'GET') {
        require_role('admin');
        respond(db()->query('SELECT id, name, sector FROM companies ORDER BY name')->fetchAll());
    }

    if ($action === 'company' && $method === 'POST') {
        require_role('admin');
        $name = text_value($data['name'] ?? '');
        $sector = text_value($data['sector'] ?? '');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 150 || mb_strlen($sector) < 2 || mb_strlen($sector) > 100) {
            respond(['error' => 'Company name must be 2-150 characters and sector 2-100 characters.'], 422);
        }
        try {
            db()->prepare('INSERT INTO companies (name, sector) VALUES (?, ?)')->execute([$name, $sector]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') respond(['error' => 'That company already exists.'], 409);
            throw $error;
        }
        respond(['message' => 'Company added.'], 201);
    }

    if ($action === 'company' && $method === 'DELETE') {
        require_role('admin');
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false) respond(['error' => 'Select a valid company.'], 422);
        db()->prepare('DELETE FROM companies WHERE id=?')->execute([$id]);
        respond(['message' => 'Company deleted.']);
    }

    if ($action === 'drive' && $method === 'POST') {
        require_role('admin');
        $name = text_value($data['company'] ?? '');
        $role = text_value($data['role'] ?? '');
        $minimum = $data['min_cgpa'] ?? '';
        $backlogs = $data['max_backlogs'] ?? '';
        $deadline = text_value($data['deadline'] ?? '');
        $package = text_value($data['package'] ?? '');
        $type = $data['drive_type'] ?? 'Full-time';
        $date = DateTime::createFromFormat('!Y-m-d', $deadline);
        if (mb_strlen($name) < 2 || mb_strlen($name) > 150 || mb_strlen($role) < 2 || mb_strlen($role) > 150 ||
            mb_strlen($package) > 80 || $minimum === '' || $backlogs === '' || $deadline === '' ||
            !is_numeric($minimum) || $minimum < 0 || $minimum > 10 || !ctype_digit((string)$backlogs) ||
            (int)$backlogs > 100 ||
            !$date || $date->format('Y-m-d') !== $deadline || $deadline < date('Y-m-d') ||
            !in_array($type, ['Full-time', 'Internship'], true)) {
            respond(['error' => 'Check the drive details and eligibility values.'], 422);
        }
        $company = db()->prepare('SELECT id FROM companies WHERE name=?');
        $company->execute([$name]);
        $companyId = $company->fetchColumn();
        if (!$companyId) {
            db()->prepare('INSERT INTO companies (name, sector) VALUES (?, ?)')->execute([$name, 'Not specified']);
            $companyId = db()->lastInsertId();
        }
        db()->beginTransaction();
        try {
            db()->prepare('INSERT INTO drives (company_id, role, package, min_cgpa, max_backlogs, drive_type, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$companyId, $role, $package, $minimum, $backlogs, $type, $deadline]);
            db()->prepare('INSERT INTO notifications (message, audience) VALUES (?, ?)')->execute([
                'New placement drive: ' . $name . ' - ' . $role . '. Apply by ' . $deadline . '.',
                'All students',
            ]);
            db()->commit();
        } catch (PDOException $error) {
            db()->rollBack();
            throw $error;
        }
        respond(['message' => 'Drive posted.'], 201);
    }

    if ($action === 'application-status' && $method === 'POST') {
        require_role('admin');
        $status = $data['status'] ?? '';
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false || !in_array($status, ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'], true)) {
            respond(['error' => 'Invalid application status.'], 422);
        }
        db()->prepare('UPDATE applications SET status=? WHERE id=?')->execute([$status, $id]);
        respond(['message' => 'Application status updated.']);
    }

    if ($action === 'experiences' && $method === 'GET') {
        respond(db()->query('SELECT e.id, e.name, e.batch, e.company, e.role, e.difficulty, e.rating, e.experience FROM experiences e ORDER BY e.created_at DESC')->fetchAll());
    }

    if ($action === 'experience' && $method === 'POST') {
        require_role('student');
        $name = text_value($data['name'] ?? '');
        $batch = text_value($data['batch'] ?? '');
        $company = text_value($data['company'] ?? '');
        $role = text_value($data['role'] ?? '');
        $difficulty = $data['difficulty'] ?? '';
        $rating = (int)($data['rating'] ?? 0);
        $experience = trim($data['experience'] ?? '');
        if (!valid_name($name) || !preg_match('/^20[0-9]{2}$/', $batch) ||
            mb_strlen($company) < 2 || mb_strlen($company) > 150 || mb_strlen($role) > 150 ||
            !in_array($difficulty, ['Easy', 'Medium', 'Hard'], true) || $rating < 1 || $rating > 5 ||
            mb_strlen($experience) < 30 || mb_strlen($experience) > 5000) {
            respond(['error' => 'Complete all fields and write at least 30 characters for your experience.'], 422);
        }
        db()->prepare('INSERT INTO experiences (user_id, name, batch, company, role, difficulty, rating, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')->execute([$user['id'], $name, $batch, $company, $role, $difficulty, $rating, $experience]);
        respond(['message' => 'Experience submitted.'], 201);
    }

    if ($action === 'dashboard' && $method === 'GET') {
        require_role('student');
        $statement = db()->prepare('SELECT phone, tenth_percent, twelfth_percent, cgpa, backlogs, skills, certifications, (resume_path IS NOT NULL) AS resume_uploaded FROM profiles WHERE user_id=?');
        $statement->execute([$user['id']]);
        $profile = $statement->fetch();
        $statement = db()->prepare('SELECT status, COUNT(*) AS total FROM applications WHERE user_id=? GROUP BY status');
        $statement->execute([$user['id']]);
        $counts = $statement->fetchAll();
        $statement = db()->prepare('SELECT COUNT(*) FROM applications WHERE user_id=?');
        $statement->execute([$user['id']]);
        $applications = (int)$statement->fetchColumn();
        $drives = db()->query('SELECT d.id, c.name AS company, d.role, d.deadline, d.min_cgpa, d.max_backlogs FROM drives d JOIN companies c ON c.id=d.company_id WHERE d.deadline >= CURDATE() ORDER BY d.deadline LIMIT 5')->fetchAll();
        respond(['profile' => $profile, 'application_count' => $applications, 'statuses' => $counts, 'drives' => $drives]);
    }

    if ($action === 'admin-summary' && $method === 'GET') {
        require_role('admin');
        respond([
            'students' => (int)db()->query("SELECT COUNT(*) FROM users WHERE role='student'")->fetchColumn(),
            'companies' => (int)db()->query('SELECT COUNT(*) FROM companies')->fetchColumn(),
            'drives' => (int)db()->query('SELECT COUNT(*) FROM drives WHERE deadline >= CURDATE()')->fetchColumn(),
            'applications' => (int)db()->query('SELECT COUNT(*) FROM applications')->fetchColumn(),
        ]);
    }

    if ($action === 'notification' && $method === 'POST') {
        require_role('admin');
        $message = text_value($data['message'] ?? '');
        if (mb_strlen($message) < 5 || mb_strlen($message) > 1000 || ($data['audience'] ?? '') !== 'All students') respond(['error' => 'Enter a message of 5-1000 characters and choose all students.'], 422);
        db()->prepare('INSERT INTO notifications (message) VALUES (?)')->execute([$message]);
        respond(['message' => 'Notification sent.']);
    }

    if ($action === 'notifications' && $method === 'GET') {
        require_role('student');
        $statement = db()->prepare("SELECT n.id, n.message, n.created_at, IF(r.notification_id IS NULL, 0, 1) AS is_read FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=? WHERE n.audience='All students' ORDER BY n.created_at DESC LIMIT 20");
        $statement->execute([$user['id']]);
        $count = db()->prepare("SELECT COUNT(*) FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=? WHERE n.audience='All students' AND r.notification_id IS NULL");
        $count->execute([$user['id']]);
        respond(['items' => $statement->fetchAll(), 'unread_count' => (int)$count->fetchColumn()]);
    }

    if ($action === 'notifications-read' && $method === 'POST') {
        require_role('student');
        db()->prepare("INSERT IGNORE INTO notification_reads (notification_id, user_id) SELECT id, ? FROM notifications WHERE audience='All students'")->execute([$user['id']]);
        respond(['message' => 'Notifications marked as read.']);
    }

    respond(['error' => 'Unknown action.'], 404);
} catch (PDOException $error) {
    error_log('Campus2Career database error: ' . $error->getMessage());
    respond(['error' => 'Database operation failed. Check the database setup and try again.'], 500);
}
