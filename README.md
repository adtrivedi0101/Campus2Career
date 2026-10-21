# Campus2Career

## Run with XAMPP

1. Start **Apache** in the XAMPP Control Panel. The project should be in `C:\xampp\htdocs\Campus2Career`.
2. Start or keep running the MySQL service you intend to use. If another MySQL service is already using port 3306, do not also start XAMPP's MySQL on that port.
3. Copy `config.local.php.example` to `config.local.php`, then set `DB_PASS` to the password for that MySQL account. The default database name is `campus2career`; update `DB_USER` or `DB_HOST` there too if needed. Do not put local credentials in `config.php` or commit `config.local.php`.
4. Open `http://localhost/campus2career/setup.php`.
5. Create the first administrator account. Setup creates the `campus2career` database and all required tables; it does not add sample records.
6. Remove or rename `setup.php` after the administrator account is created.
7. Open `http://localhost/campus2career/login.html`. Students can register from the Register tab; administrators use the account created in step 5.

Use the `http://localhost/...` address, not `file://` or the HTML files opened directly. PHP sessions protect the pages and API requests, and records are stored in MySQL.

The local database settings file is excluded from Git and blocked from direct web access. Environment variables named `CAMPUS2CAREER_DB_HOST`, `CAMPUS2CAREER_DB_NAME`, `CAMPUS2CAREER_DB_USER`, and `CAMPUS2CAREER_DB_PASS` override values in that file.

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
