# Campus2Career Feature Implementation Proof

**Updated:** October 20, 2026

This document records the local setup and company-management changes implemented and verified in Campus2Career.

## Local application setup

- Installed the PHP 8.4 command-line runtime for the current Windows user. The project also requires the `pdo_mysql`, `mbstring`, and `fileinfo` PHP extensions.
- Used the existing, automatically running MySQL 8.0 `MySQL80` Windows service; no second database server was installed.
- Initialized the `campus2career` database and its application tables and created the initial administrator account. Credentials are intentionally not recorded here.
- Added environment-variable support for the database connection in `config.php` so local credentials do not need to be written into project source.
- Added `dev-router.php` and documented how to run PHP's built-in server on `127.0.0.1:8000` when Apache/XAMPP is unavailable. The router enforces the project's protected page wrappers and blocks direct access to connection and guard files.
- The application was verified responding at `http://127.0.0.1:8000/login.html`. Administrator login, the protected admin page, an authenticated API session, and logout were also verified.

## Company management and notifications

- Fixed the company form reset error. An asynchronous submit handler now saves a reference to its form before awaiting the API, instead of reading `event.currentTarget` after the event has finished dispatching.
- Applied the same safe form-reference pattern to the drive and notification forms, which used the same asynchronous reset behavior.
- Each successfully created company now generates an **All students** notification with the message `New company added: <company name>.`
- Saving the company and creating its notification happen in one database transaction. If either database operation fails, both are rolled back; attempting to add a duplicate company does not create a notification.
- Bumped the admin script's cache version so browsers load the corrected form handler.

## Company records verified

The database contained the following company rows when checked on October 20, 2026:

| Company | Sector |
| --- | --- |
| Cisco | Networking |
| Walmart | E-Commerce |
| Infosys | IT |

The database therefore contains **three** companies, including Infosys, despite the admin page initially displaying only Cisco and Walmart. Company records do not have a creation timestamp, so their precise creation times cannot be determined from the current schema.

## Validation performed

- Checked the database directly for the company names and sectors.
- Added a temporary verification company through the admin page and confirmed its form reset, success message, and new table row; removed the test company afterward.
- Confirmed that the successful test addition created the expected `All students` notification, then removed the test notification so it does not appear in the application.
- Confirmed the test company and notification were both cleaned up and the three original company records remain.
- Verified the local application and setup page respond, and internal database connection files are blocked.
- Verified PHP syntax for the setup/configuration and development-router scripts.
- Verified PHP syntax for the updated API.
- Verified administrator login, the admin page, API session, and logout.
