# Campus2Career: Project Analysis

## 1. What This Project Does

Campus2Career is a college placement portal. Students can maintain a placement profile, see company drives, apply when they meet the drive requirements, follow application progress, and read or share interview experiences. Placement administrators can manage companies and drives, review applications, change application statuses, and send announcements.

The application runs as a website. A web browser shows the pages, a PHP server handles requests and rules, and a MySQL-compatible database stores the records.

## 2. Technology Used

| Part | Technology | In everyday terms |
| --- | --- | --- |
| Page structure | HTML | The content and forms shown on each page. |
| Page styling | CSS in `css/style.css` | The colors, spacing, layout, and responsive appearance. |
| Browser behavior | Plain JavaScript in `js/` | Form handling, page updates, filtering, and requests to the server. |
| Server | PHP | Login checks, input validation, business rules, file uploads, and database operations. |
| Database connection | PDO with the MySQL driver | PHP's standard database interface, using prepared statements to send queries. |
| Data storage | MySQL or compatible MariaDB | Stores accounts, profiles, drives, applications, and other records. XAMPP commonly bundles MariaDB. |
| Web server for the documented setup | Apache, through XAMPP | Serves the site and runs PHP. Its rewrite rules connect the `.html` URLs to PHP access checks. |

There is no frontend framework, package manager, or third-party JavaScript dependency visible in the project. The browser code uses standard JavaScript and the built-in `fetch` API.

## 3. How the Parts Work Together

Think of the browser as the counter where someone fills out a form, PHP as the staff member who checks the request, and MySQL as the filing cabinet where the records are kept.

For a typical interaction:

1. The browser asks Apache for a page such as `drives.html`.
2. Apache reads the rewrite rule in `.htaccess` and runs `drives.php`. The PHP wrapper checks that the visitor is signed in as a student, then includes the page's HTML.
3. The page loads shared JavaScript (`js/main.js`) and its own JavaScript (`js/drives.js`).
4. That JavaScript calls an address such as `api.php?action=drives` and sends or receives JSON (a text format commonly used to exchange data).
5. `api.php` checks the session, role, request data, and, for changes, the CSRF token. It uses `db.php` to connect to MySQL and run database queries.
6. PHP returns a JSON response. JavaScript uses it to update the page without a full page reload.

In short:

```text
Browser (HTML/CSS/JavaScript)
    -> Apache routes the page request
    -> PHP page wrapper checks access
    -> JavaScript calls api.php
    -> PHP validates and applies rules
    -> PDO reads/writes MySQL
    -> JSON returns to the browser
```

The `.html` links are intentional: Apache's rewrite rule maps the listed page names to matching `.php` wrappers. Open the site through Apache, not by double-clicking an HTML file or using `file://`.

## 4. Main Project Files

| File or folder | Purpose |
| --- | --- |
| `index.html`, `login.html`, `student-dashboard.html`, `profile.html`, `drives.html`, `applications.html`, `seniors.html`, `admin.html` | Page layouts and forms. Under Apache, their matching PHP wrappers run first. |
| `index.php`, `login.php`, `student-dashboard.php`, `profile.php`, `drives.php`, `applications.php`, `seniors.php`, `admin.php` | Page entry points. They include the shared access guard, check the required role where needed, and include the HTML. |
| `api.php` | The central backend endpoint. The `action` query parameter selects the operation, for example `api.php?action=profile`. |
| `auth_guard.php` | Starts the PHP session and provides page-level login and role checks. |
| `config.php` | Database connection settings: host, database name, username, and password. |
| `db.php` | Creates and reuses the PDO database connection. |
| `setup.php` | First-time setup page. It creates the database and tables and creates the first administrator. |
| `css/style.css` | Shared page styling. |
| `js/main.js` | Shared API helper, session/CSRF handling, navigation, tabs, toast messages, and logout behavior. |
| `js/auth.js` | Login and student registration behavior. |
| `js/dashboard.js`, `js/profile.js`, `js/drives.js`, `js/applications.js`, `js/seniors.js`, `js/admin.js` | JavaScript specific to each page. |
| `uploads/resumes/` | Private-by-convention server storage location for uploaded PDF resumes. The database stores the generated filename in the profile, not the file contents. |
| `.htaccess` | Disables directory listings, maps selected `.html` page URLs to PHP wrappers, and blocks direct web access to internal connection/guard files. Requires Apache rewrite support. |
| `README.md` | Short XAMPP startup instructions and a feature overview. |

## 5. Database Structure

On first setup, `setup.php` creates a database named `campus2career` and these InnoDB tables. It does not create example companies, drives, or student accounts.

| Table | What it stores |
| --- | --- |
| `users` | Student and administrator accounts, names, email addresses, student registration numbers, departments, password hashes, and roles. |
| `profiles` | A student's phone number, academic results, backlog count, skills, certifications, and resume filename. Each profile belongs to one user. |
| `companies` | Company names and sectors. |
| `drives` | A company's role, package, minimum CGPA, maximum allowed backlogs, drive type, and application deadline. |
| `applications` | Which student applied to which drive and the current status: Applied, Shortlisted, Interview, Selected, or Rejected. A unique constraint prevents the same student applying twice to the same drive. |
| `experiences` | Student-submitted interview experience, including company, role, batch, difficulty, rating, and written tips. |
| `notifications` | Announcements for students, including automatic announcements when a new drive is posted. |
| `notification_reads` | Which students have marked which notifications as read. This allows read/unread state to differ for each student. |

Important connections:

- One `users` row can have one `profiles` row. Deleting a user also deletes their profile.
- One company can have many drives. A drive belongs to one company.
- Students and drives are connected through `applications`: a student can apply to many drives, and a drive can receive applications from many students.
- One user can submit multiple experiences.
- Notifications and students are connected through `notification_reads` to track each student's read state.
- Foreign keys keep related records connected. Some deletions cascade, which means related rows are removed along with their parent.

Skills and certifications are saved as JSON-formatted text inside the profile table. Resume PDF bytes are saved as a file under `uploads/resumes/`; the profile table only holds its generated filename.

## 6. Typical User Flows

### First-time setup and login

1. An administrator opens `setup.php` and creates the initial admin account.
2. Setup creates the database tables and saves the password as a secure password hash, rather than plain text.
3. The admin signs in through the login page. Students register there and then sign in.
4. PHP keeps the signed-in identity in a session cookie. The browser JavaScript asks `api.php?action=session` for the current session and CSRF token.
5. The site sends the user to the admin panel or student dashboard based on the account role.

### Student profile and applications

1. The profile page loads saved details with `api.php?action=profile`.
2. When saved, PHP validates the phone number and academic values, then updates the profile in MySQL.
3. On the Drives page, the browser loads open drives and the student's profile. It displays whether the student meets each drive's CGPA and backlog requirements.
4. When the student applies, PHP checks eligibility and the deadline again on the server. This is important because browser-side checks alone can be bypassed.
5. A successful application is stored with status `Applied`. The student can see it in Applications.
6. An admin can later change that status. The student sees the updated status next time applications are loaded.

### Admin management and notifications

1. The admin adds a company and posts a drive with eligibility rules and a deadline.
2. Posting a drive creates a notification for all students.
3. The admin can review applications and update each status.
4. Students see announcements and can mark them as read. The read status is stored separately for each student.

### Resume upload

The browser checks that a selected file is a PDF under 2 MB. PHP checks the upload again, including its MIME type and PDF signature, saves it with a random filename in `uploads/resumes/`, and records that filename in the student's profile. Downloading goes through the API, which checks the signed-in student and looks up their own saved file.

## 7. Access and Data Safety

- Passwords are stored using PHP's `password_hash` and checked using `password_verify`.
- Database operations use PDO prepared statements, which separate user-provided values from SQL commands.
- API actions check that a user is signed in and that the role is allowed for the action.
- Non-GET API requests after login require a CSRF token. This is a session-bound check intended to prevent another site from silently submitting changes as the signed-in user.
- The code validates inputs on the server. The browser also checks some fields to give faster feedback, but server checks are authoritative.
- JavaScript escapes dynamic values before inserting them into HTML in the pages that render user-supplied text.
- `.htaccess` blocks direct requests for `config.php`, `db.php`, and `auth_guard.php`, and disables directory listings. Keep Apache's rewrite module enabled so page access checks are applied.
- Resume files are stored below the web root. The normal download endpoint checks the student's session, but `.htaccess` does not explicitly block direct requests to `uploads/resumes/`. For a public deployment, store resumes outside the web root or configure Apache to deny direct access to that directory.
- After initial setup, remove or rename `setup.php` as the README instructs. Do not leave the installer available on a public deployment.
- The defaults in `config.php` are for a local XAMPP database. Change them for a different local account; do not use default development credentials in a public deployment.

## 8. Requirements

For the documented Windows setup, install XAMPP with Apache, PHP, and MySQL/MariaDB. The PHP code uses PDO's MySQL driver, `mbstring`, and `fileinfo`; make sure those extensions are enabled in the XAMPP PHP configuration. PHP 7.4 or newer is a reasonable minimum for the syntax used here; a currently supported PHP version is recommended.

Apache must allow `.htaccess` overrides and have `mod_rewrite` enabled. XAMPP normally provides the expected configuration. The web server's PHP process also needs permission to write files in `uploads/resumes/`.

There is no `npm install`, Composer install, or frontend build step: the browser assets are already in the repository.

## 9. Start It on Windows with XAMPP

1. Install XAMPP if it is not already installed.
2. Put the project folder inside XAMPP's web directory, usually `C:\xampp\htdocs\Campus2Career`. The folder name determines the URL path. If the project is stored elsewhere, copy or move the folder into `htdocs` first.
3. Open **XAMPP Control Panel** and click **Start** for **Apache** and **MySQL**. Keep both running while using the site.
4. Check `config.php`. The defaults are host `127.0.0.1`, database `campus2career`, user `root`, and an empty password, which match a common local XAMPP setup. Adjust the user/password if yours differ.
5. In a browser, visit `http://localhost/Campus2Career/setup.php` (use the exact folder name under `htdocs`). Create the first administrator account. Setup creates the database and tables automatically.
6. After setup succeeds, remove or rename `setup.php` as a safety measure.
7. Visit `http://localhost/Campus2Career/login.html`. Sign in as the administrator, or use the Register tab to create a student account.

To reach the project directory in PowerShell, the command is:

```powershell
Set-Location C:\xampp\htdocs\Campus2Career
```

The PowerShell command only changes the folder for your terminal. Start Apache and MySQL in the XAMPP Control Panel; both are separate background services. Use the browser URL above, not a local file path. `file://`, VS Code Live Server, and Python's simple HTTP server do not run the PHP backend.

## 10. Common Startup Problems

| Symptom | Things to check |
| --- | --- |
| The browser cannot connect | Confirm Apache is running and the URL folder matches the folder inside `htdocs`. Another program may already be using Apache's port (usually 80). |
| The page appears, but API calls fail | Confirm PHP is running through Apache, MySQL is running, and `config.php` has the correct database account. Check the Apache/PHP error log for server details. |
| Database connection/setup fails | Confirm MySQL is running, the username/password are correct, and that account may create a database. `setup.php` creates the database itself. |
| `.html` pages do not enforce login | Confirm Apache's rewrite module is enabled and `.htaccess` overrides are allowed. Without the rewrite, Apache may serve the raw HTML directly instead of the PHP access wrapper. |
| Resume upload fails | Check the 2 MB limit, PHP upload limits, enabled `fileinfo`, and write permission for `uploads/resumes/`. |
| Login is rejected | Check that setup completed, the account type matches the selected role, and the email/password are correct. |

## 11. API Actions at a Glance

The frontend sends requests to `api.php` with an `action` value. Most data-changing actions use POST; company deletion uses DELETE. The API returns JSON and an HTTP status code.

| Action | What it does |
| --- | --- |
| `login`, `register`, `session`, `logout` | Sign in, create a student account, check the active session, and sign out. |
| `profile`, `resume`, `resume-download` | Read or update the student profile and upload/download that student's resume. |
| `drives`, `apply`, `applications` | List active drives, submit an eligible application, and list applications. Admins see all applications; students see their own. |
| `companies`, `company`, `drive`, `application-status`, `admin-summary` | Admin company, drive, application-status, and dashboard operations. |
| `experiences`, `experience` | Read shared interview experiences and submit one as a student. |
| `dashboard`, `notifications`, `notification`, `notifications-read` | Load student dashboard information and manage student announcements/read status. |

## 12. Current Scope and Limitations

- Setup creates an empty application database except for the first administrator. An admin must add companies and drives before students will see opportunities.
- The notification audience currently supports `All students` only.
- Resume uploads are limited to PDF files of 2 MB or less.
- This repository describes a local/student-project setup, not a production deployment. A public deployment needs production-grade credentials, HTTPS, backups, server configuration, and review of operational security settings.
