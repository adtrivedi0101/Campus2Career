# Campus2Career

## Run with XAMPP

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Check `config.php`. The defaults use XAMPP's usual `root` MySQL account with no password. Change the settings if your MySQL account differs.
3. Open `http://localhost/campus2career/setup.php`.
4. Create the first administrator account. Setup creates the `campus2career` database and all required tables; it does not add sample records.
5. Remove or rename `setup.php` after the administrator account is created.
6. Open `http://localhost/campus2career/login.html`. Students can register from the Register tab; administrators use the account created in step 4.

Use the `http://localhost/...` address, not `file://` or the HTML files opened directly. PHP sessions protect the pages and API requests, and records are stored in MySQL.

The administrator can add companies and placement drives, update application statuses, and send notifications to all students. Posting a drive also creates a notification for students. After signing in, students see unread notifications at the top of their dashboard and in its Notifications list; the dashboard refreshes while open and students can mark messages as read. Open drives appear on both the dashboard and Drives page until their deadline. Students can complete their profiles, apply to eligible open drives, upload a PDF resume, track applications, and share interview experiences.
