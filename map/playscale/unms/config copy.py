# config.py

# Website
LOGIN_URL = "https://bharatnetlive.bbnlindia.in/UNMS/index.jsp"
REPORT_URL = "https://bharatnetlive.bbnlindia.in/UNMS/modules/FtthBiReports/jsp/_FtthConnectionHistoryDetailedReport.jsp?subCategory=&scheme=ALL&reportName=ftth_gross_hist_report&selectedDate=2026-06-02&reportType=gross&stateColumn=UTTARAKHAND&isCategoryConditionApplied=true&district=&serviceProvider=all&state=UTTARAKHAND&district100RadioBtn=all&districtColumn=&category=ALL&"

USERNAME = "XXXX"
PASSWORD = "xxxx"

# Download
DOWNLOAD_DIR = "downloads"

# MySQL
MYSQL_USER = "uktx"
MYSQL_PASSWORD = "uktx123"
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_DATABASE = "ukcfa"

TABLE_NAME = "BNU_FTTH"

# Selectors
USERNAME_SELECTOR = "#j_username"
PASSWORD_SELECTOR = "#j_password"
LOGIN_BUTTON_SELECTOR = "button[type='submit']"

PRINT_BUTTON_SELECTOR = "text=Print"
# EXPORT_EXCEL_SELECTOR = "text=Export Report (MS Excel)"
ALL_PAGES_SELECTOR = "text=All Pages"
EXPORT_BUTTON_SELECTOR = "text=Export"
EXCEL_EXPORT_SELECTOR = 'span[id$="_exportForm_expall_label"]'