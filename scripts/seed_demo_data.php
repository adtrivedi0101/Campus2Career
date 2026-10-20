<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../db.php';

$demoEmail = 'demo.student@campus2career.test';
$demoPassword = 'DemoStudent123!';
$companies = [
    ['name' => 'Aster Analytics Labs', 'sector' => 'IT Services', 'role' => 'Junior Data Analyst', 'package' => '6.0 LPA', 'min_cgpa' => 7.0, 'max_backlogs' => 0, 'drive_type' => 'Full-time', 'status' => 'Applied', 'days' => 30],
    ['name' => 'Bluebird Cloud Systems', 'sector' => 'Cloud Computing', 'role' => 'Cloud Support Associate', 'package' => '7.2 LPA', 'min_cgpa' => 7.5, 'max_backlogs' => 0, 'drive_type' => 'Full-time', 'status' => 'Shortlisted', 'days' => 40],
    ['name' => 'Cedar FinTech Demo', 'sector' => 'Financial Technology', 'role' => 'Software Engineering Intern', 'package' => '35,000/month', 'min_cgpa' => 7.0, 'max_backlogs' => 0, 'drive_type' => 'Internship', 'status' => 'Interview', 'days' => 50],
    ['name' => 'Delta Robotics Studio', 'sector' => 'Robotics', 'role' => 'Graduate Software Engineer', 'package' => '8.5 LPA', 'min_cgpa' => 8.0, 'max_backlogs' => 0, 'drive_type' => 'Full-time', 'status' => 'Selected', 'days' => 60],
    ['name' => 'Evergreen Health Tech Demo', 'sector' => 'Healthcare Technology', 'role' => 'Application Support Trainee', 'package' => '5.8 LPA', 'min_cgpa' => 6.5, 'max_backlogs' => 0, 'drive_type' => 'Full-time', 'status' => 'Rejected', 'days' => 70],
];

$pdo = db();
$pdo->beginTransaction();
try {
    $findStudent = $pdo->prepare("SELECT id, full_name, registration_number, role, password_hash FROM users WHERE email=?");
    $findStudent->execute([$demoEmail]);
    $demoUser = $findStudent->fetch();
    if ($demoUser && (
        $demoUser['role'] !== 'student' ||
        $demoUser['full_name'] !== 'Demo Student' ||
        $demoUser['registration_number'] !== 'DEMO-C2C-01' ||
        !password_verify($demoPassword, $demoUser['password_hash'])
    )) {
        throw new RuntimeException('The reserved demo email is already in use by a different account.');
    }
    if (!$demoUser) {
        $statement = $pdo->prepare("INSERT INTO users (full_name, registration_number, department, email, password_hash, role) VALUES (?, ?, ?, ?, ?, 'student')");
        $statement->execute([
            'Demo Student',
            'DEMO-C2C-01',
            'CSE',
            $demoEmail,
            password_hash($demoPassword, PASSWORD_DEFAULT),
        ]);
        $studentId = (int)$pdo->lastInsertId();
    } else {
        $studentId = (int)$demoUser['id'];
    }

    $pdo->prepare('INSERT IGNORE INTO profiles (user_id) VALUES (?)')->execute([$studentId]);
    $pdo->prepare('UPDATE profiles SET phone=?, tenth_percent=?, twelfth_percent=?, cgpa=?, backlogs=?, skills=?, certifications=? WHERE user_id=?')->execute([
        '9876543210',
        88.50,
        91.25,
        8.40,
        0,
        json_encode(['PHP', 'SQL', 'JavaScript', 'Data Analysis'], JSON_THROW_ON_ERROR),
        json_encode(['Database Fundamentals', 'Introduction to Cloud Computing'], JSON_THROW_ON_ERROR),
        $studentId,
    ]);

    $companyIds = [];
    $upsertCompany = $pdo->prepare('INSERT INTO companies (name, sector) VALUES (?, ?) ON DUPLICATE KEY UPDATE sector=VALUES(sector)');
    $findCompany = $pdo->prepare('SELECT id FROM companies WHERE name=?');
    foreach ($companies as $company) {
        $upsertCompany->execute([$company['name'], $company['sector']]);
        $findCompany->execute([$company['name']]);
        $companyIds[] = (int)$findCompany->fetchColumn();
    }

    $findDrive = $pdo->prepare('SELECT id FROM drives WHERE company_id=? AND role=? LIMIT 1');
    $insertDrive = $pdo->prepare('INSERT INTO drives (company_id, role, package, min_cgpa, max_backlogs, drive_type, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $updateDrive = $pdo->prepare('UPDATE drives SET package=?, min_cgpa=?, max_backlogs=?, drive_type=?, deadline=? WHERE id=?');
    $upsertApplication = $pdo->prepare('INSERT INTO applications (user_id, drive_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)');
    foreach ($companies as $index => $company) {
        $deadline = (new DateTimeImmutable('today'))->modify('+' . $company['days'] . ' days')->format('Y-m-d');
        $findDrive->execute([$companyIds[$index], $company['role']]);
        $driveId = $findDrive->fetchColumn();
        if ($driveId === false) {
            $insertDrive->execute([
                $companyIds[$index],
                $company['role'],
                $company['package'],
                $company['min_cgpa'],
                $company['max_backlogs'],
                $company['drive_type'],
                $deadline,
            ]);
            $driveId = (int)$pdo->lastInsertId();
        } else {
            $driveId = (int)$driveId;
            $updateDrive->execute([
                $company['package'],
                $company['min_cgpa'],
                $company['max_backlogs'],
                $company['drive_type'],
                $deadline,
                $driveId,
            ]);
        }
        $upsertApplication->execute([$studentId, $driveId, $company['status']]);
    }

    $experienceText = 'The interview included a short SQL exercise, a project discussion, and practical questions about debugging and teamwork. Preparing clear examples helped me explain my approach.';
    $findExperience = $pdo->prepare('SELECT id FROM experiences WHERE user_id=? AND batch=? AND company=? AND role=? LIMIT 1');
    $findExperience->execute([$studentId, '2026', $companies[3]['name'], $companies[3]['role']]);
    if (!$findExperience->fetchColumn()) {
        $pdo->prepare('INSERT INTO experiences (user_id, name, batch, company, role, difficulty, rating, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')->execute([
            $studentId,
            'Demo Student',
            '2026',
            $companies[3]['name'],
            $companies[3]['role'],
            'Medium',
            4,
            $experienceText,
        ]);
    }

    $demoMessages = [
        'Welcome to the Campus2Career demo. This sample account is populated with fictional placement data.',
        'Demo placement week: review the sample drives and application updates.',
        'Tip: complete your profile before applying to placement drives.',
    ];
    $notificationIds = [];
    $findNotification = $pdo->prepare("SELECT id FROM notifications WHERE message=? AND audience='All students' LIMIT 1");
    $insertNotification = $pdo->prepare("INSERT INTO notifications (message, audience) VALUES (?, 'All students')");
    foreach ($demoMessages as $message) {
        $findNotification->execute([$message]);
        $notificationId = $findNotification->fetchColumn();
        if (!$notificationId) {
            $insertNotification->execute([$message]);
            $notificationId = $pdo->lastInsertId();
        }
        $notificationIds[] = (int)$notificationId;
    }

    $pdo->prepare('INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)')->execute([
        $notificationIds[0],
        $studentId,
    ]);
    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $error;
}

echo "Demo data seeded successfully.\n";
echo "Student login: {$demoEmail}\n";
echo "Student password: {$demoPassword}\n";
echo 'Sample applications: ' . count($companies) . "\n";
