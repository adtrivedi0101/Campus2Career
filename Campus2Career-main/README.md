# Campus2Career

Campus2Career is a responsive, multi-page placement portal built with HTML,
CSS, and vanilla JavaScript. It has no build step or package dependencies.

The portal includes browser-local student/admin accounts, searchable and
filterable placement drives, eligibility checks, an application confirmation
flow, application tracking, profile editing, senior interview experiences,
and an admin page for managing companies, applications, drives, and
notifications. Student profiles and applications are kept separate by account;
admin-posted drives, companies, notifications, and shared senior experiences
are visible across accounts in the same browser. The site starts without
sample accounts, applications, drives, companies, or interview stories; admins
and students add the records they want to use.

## Deploy to Vercel

1. Push this project to a Git provider supported by Vercel.
2. In Vercel, choose **Add New Project** and import the repository.
3. Set the project root to the directory containing `index.html` and
   `vercel.json`.
4. Leave the framework preset as **Other**. Do not set a build command or
   install command. Deploy the project.

Alternatively, from the project root, use the Vercel CLI:

```sh
npx vercel
```

The site entry point is `index.html`. Other pages are separate HTML files and
can be opened directly, for example `/login.html` or `/drives.html`.
`vercel.json` adds a small set of security-related response headers; it does
not change page routing or content.

## Current implementation

This is a static, browser-based prototype. Accounts and module data use browser
local storage and do not synchronize between browsers or devices. Passwords
are salted and hashed in the browser, but client-side checks are not secure
authentication and can be bypassed or erased by the browser owner. Resume
files are saved only in that browser's local storage. Do not use the site to
collect real credentials, personal information, or resumes. A production
placement service needs a backend, server-side authentication and
authorization, shared persistent storage, secure file handling, and
appropriate privacy controls.
