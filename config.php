<?php
define('DB_HOST', getenv('CAMPUS2CAREER_DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('CAMPUS2CAREER_DB_NAME') ?: 'campus2career');
define('DB_USER', getenv('CAMPUS2CAREER_DB_USER') ?: 'root');
$dbPassword = getenv('CAMPUS2CAREER_DB_PASS');
define('DB_PASS', $dbPassword === false ? '' : $dbPassword);
