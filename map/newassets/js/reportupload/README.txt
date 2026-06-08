Project skeleton:
- index.html
- upload.php
- config.php

Extend upload.php/process.php to:
1. Detect report by headers
2. Create table from template
3. Bulk insert
4. ON DUPLICATE KEY UPDATE
5. Return JSON stats:
   rows_found
   rows_inserted
   duplicates_updated
