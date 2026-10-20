# Campus2Career

## Run with XAMPP

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Check `config.php`. The defaults use XAMPP's usual `root` MySQL account with no password. Change the settings if your MySQL account differs.
3. Open `http://localhost/campus2career/setup.php`.
4. Create the first administrator account. Setup creates the `campus2career` database and all required tables; it does not add sample records.
5. Remove or rename `setup.php` after the administrator account is created.
6. Open `http://localhost/campus2career/login.html`. Students can register from the Register tab; administrators use the account created in step 4.

Use the `http://localhost/...` address, not `file://` or the HTML files opened directly. PHP sessions protect the pages and API requests, and records are stored in MySQL.

The login/register page validates account details in the browser and on the server. Student registration requires a valid student number, department, agreement to the terms checkbox, and a password with at least eight characters including uppercase, lowercase, a number, and a special character. **Remember me** keeps the sign-in cookie for up to 30 days. Password-reset functionality is not included.

The student dashboard visualizes the signed-in student's real applications, profile checklist, notifications, eligible open drives, and deadlines. Its readiness score uses resume and skill information alongside clearly labeled starter estimates for aptitude and interview preparation.

For local development without Apache, PHP's built-in server can serve the project using `dev-router.php`. In PowerShell, from the project directory, run:

```powershell
$env:CAMPUS2CAREER_DB_USER = 'root'
$env:CAMPUS2CAREER_DB_PASS = 'your-mysql-password'
$php = (Get-Command php).Source
$extensions = Join-Path (Split-Path $php) 'ext'
php -d "extension_dir=$extensions" -d extension=pdo_mysql -d extension=mbstring -d extension=fileinfo -S 127.0.0.1:8000 dev-router.php
```

The database environment variables can be omitted when using the default credentials. Open `http://127.0.0.1:8000/`. This development server is bound to the local machine and is not a production deployment.

The administrator can add companies and placement drives, update application statuses, and send notifications to all students. Posting a drive also creates a notification for students. After signing in, students see unread notifications at the top of their dashboard and in its Notifications list; the dashboard refreshes while open and students can mark messages as read. Open drives appear on both the dashboard and Drives page until their deadline. Students can complete their profiles, apply to eligible open drives, upload a PDF resume, track applications, and share interview experiences.
