# DataSync — Excel → Database Sync Engine

A PHP/JS web app to batch-sync Excel data into a MySQL database with real-time progress feedback.

---

## Files

```
excel-sync/
├── index.html          ← Frontend UI (upload + progress)
├── sync.php            ← Backend batch processor (PHP 7.4+)
├── example_config.txt  ← Sample config file to upload
└── README.md
```

---

## Requirements

| Requirement | Version |
|---|---|
| PHP | 7.4+ |
| MySQL / MariaDB | 5.7+ / 10.3+ |
| PHP PDO extension | enabled |
| PHP PDO_MySQL | enabled |
| Web server | Apache / Nginx |

---

## Setup

### 1. Deploy files
Copy all files to your PHP-enabled web server (e.g. `/var/www/html/excel-sync/`).

### 2. Verify PHP extensions
```bash
php -m | grep -i pdo
# Should list: PDO, pdo_mysql
```

### 3. Set file permissions
```bash
chmod 644 index.html sync.php
```

### 4. Adjust PHP limits (php.ini) for large files
```ini
upload_max_filesize = 50M
post_max_size = 55M
max_execution_time = 120
memory_limit = 256M
```

> **Note:** The app processes Excel client-side (in the browser via SheetJS) and only sends
> parsed row data to PHP — so large files work fine even with default limits.

---

## How It Works

```
Browser                         PHP (sync.php)           MySQL
  │                                   │                    │
  ├─ User uploads Excel file          │                    │
  ├─ SheetJS parses it locally        │                    │
  ├─ Split rows into batches          │                    │
  │                                   │                    │
  ├──── POST /sync.php (batch 1) ────►│                    │
  │     { rows, conf, db }            ├── Bulk UPDATE ────►│
  │◄──── { processed, errors } ───────│◄── rowCount ───────│
  │  [progress bar updates]           │                    │
  │                                   │                    │
  ├──── POST /sync.php (batch 2) ────►│                    │
  │     ...                           │                    │
  │                                   │                    │
  └─ Done banner shown                │                    │
```

### Bulk SQL Strategy

**UPDATE action:**
```sql
UPDATE `TABLE` SET
  `PHASE`    = CASE `A` WHEN 'v1' THEN ? WHEN 'v2' THEN ? … ELSE `PHASE` END,
  `BACKHAUL` = CASE `A` WHEN 'v1' THEN ? WHEN 'v2' THEN ? … ELSE `BACKHAUL` END
WHERE `A` IN ('v1','v2',…);
```

**INSERT action (upsert):**
```sql
INSERT INTO `TABLE` (`A`,`PHASE`,`BACKHAUL`) VALUES (?,?,?),(?,?,?)…
ON DUPLICATE KEY UPDATE `PHASE`=VALUES(`PHASE`), `BACKHAUL`=VALUES(`BACKHAUL`);
```

---

## Config Format

The config controls what the sync does:

```javascript
const conf = {
  table_name: "BLOCK",       // Target MySQL table
  action: "update",          // "insert" or "update"
  sheet: "Sheet1",           // Excel sheet name
  unique_id: "A",            // Column letter used to match rows (must be PK or unique in DB)
  update_fields: ["PHASE", "BACKHAUL", "MEDIA"],  // DB column names
  values: ["B", "C", "D"]   // Corresponding Excel column letters
};
```

**Column letter → index mapping:**
- `"A"` = column 1 (zero-index: 0)
- `"B"` = column 2, `"Z"` = 26, `"AA"` = 27, etc.

---

## Security

- Table names and field names are validated with a regex (`/^[A-Za-z_][A-Za-z0-9_]*$/`)
- All SQL uses **prepared statements with parameterised queries** (no string interpolation of user data)
- DB credentials are sent per-request and never stored server-side
- No file storage on server (Excel is parsed client-side)

---

## Performance Tips

| Dataset size | Recommended batch size |
|---|---|
| < 1,000 rows | 200–500 |
| 1,000–10,000 rows | 200 |
| 10,000–100,000 rows | 100–150 |

For very large datasets:
- Add an index on the `unique_id` column in MySQL
- Use `action: "insert"` with `ON DUPLICATE KEY UPDATE` (faster than UPDATE)
- Consider `SET innodb_flush_log_at_trx_commit=2` temporarily for bulk loads

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "DB connection failed" | Check host/port/credentials; verify PDO_MySQL is installed |
| "Sheet not found" | Check sheet name in config matches exactly (case-sensitive) |
| Progress freezes | Reduce batch size; check server logs |
| 0 rows updated | Ensure `unique_id` column matches a real DB column with data |
| CORS error | Serve both files from the same origin / server |
