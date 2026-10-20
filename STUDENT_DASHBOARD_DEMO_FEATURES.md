# Student Dashboard and Demo Data Features

**Implemented:** October 21, 2026

This document describes the profile-resume display, student analytics, and fictional demo records added for local Campus2Career demonstrations.

## Current resume on the profile

- The profile clearly distinguishes an already uploaded resume from a newly selected file.
- When a saved resume exists, the profile says that a PDF is saved and provides a **Download saved resume** link.
- After a replacement upload succeeds, the selected PDF's filename is displayed and the download link remains available.
- Browsers intentionally do not restore a previously uploaded file into the file-picker control. Its “No file chosen” prompt refers to a new upload selection; it does not mean the existing saved resume was deleted.

## Student dashboard analytics

- Replaced the four basic application-count cards with an application-status breakdown for Applied, Shortlisted, Interview, Selected, and Rejected applications.
- Added student-specific **applications in progress**, **employer response rate**, and **selection rate** insights.
- The analytics summary reports the number of currently open drives that match the signed-in student's CGPA and backlog count.
- Application metrics are scoped to the authenticated student; eligible-drive counts use that student's own profile.
- The demo student's analytics show five applications (one per status), three in progress, an 80% employer response rate, a 20% selection rate, and six eligible upcoming drives.

## Fictional demo dataset

From the project directory, set `CAMPUS2CAREER_DB_USER` and `CAMPUS2CAREER_DB_PASS` in PowerShell, then run:

```powershell
$php = (Get-Command php).Source
$extensions = Join-Path (Split-Path $php) 'ext'
& $php -d "extension_dir=$extensions" -d extension=pdo_mysql -d extension=mbstring -d extension=fileinfo scripts/seed_demo_data.php
```

The script inserts or updates only reserved demo records, runs within a transaction, and is safe to rerun. It does not delete or overwrite existing student accounts or user-submitted records. Existing application, profile, notification, and company data is retained.

The seeded fictional student can sign in with:

- **Email:** `demo.student@campus2career.test`
- **Password:** `DemoStudent123!`

Use these demo-only credentials only on the local development instance. The student profile includes sample academic information and skills. Five fictional companies and drives provide one sample application in each status: Applied, Shortlisted, Interview, Selected, and Rejected. A sample interview experience and three student announcements are included; the welcome announcement is marked read for the demo account.

The script adds and uses the demo student and profile, companies, drives, applications, experience, notifications, and notification-read records. It leaves the existing administrator account and all other existing records untouched.

## Validation

The seeder was run twice. Counts remained stable, confirming reruns do not add duplicate demo records:

| Table | Total rows after seeding |
| --- | ---: |
| `users` | 3 |
| `profiles` | 2 |
| `companies` | 9 |
| `drives` | 6 |
| `applications` | 6 |
| `experiences` | 1 |
| `notifications` | 6 |
| `notification_reads` | 3 |

The existing student's profile page was also checked: it identifies the saved PDF and displays the download link separately from the browser's empty file-picker control. The dashboard and demo login were exercised in the browser; the five application-status bars and derived response, selection, and eligible-drive insights matched the seeded data. PHP syntax and Git whitespace checks passed.
