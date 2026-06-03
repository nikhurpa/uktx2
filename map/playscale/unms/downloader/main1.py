from pathlib import Path
import time

import pandas as pd
from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine

import config
import traceback


def login(page):
    print("Opening login page...")

    page.goto(config.LOGIN_URL,    
              wait_until="domcontentloaded",
              timeout=60000
    )

    page.fill(
        config.USERNAME_SELECTOR,
        config.USERNAME
    )

    page.fill(
        config.PASSWORD_SELECTOR,
        config.PASSWORD
    )

    page.click(
        config.LOGIN_BUTTON_SELECTOR
    )
    page.wait_for_load_state("domcontentloaded")

    print("Login successful")


def navigate_to_report(page):
    print("Opening report page...")

    page.goto(config.REPORT_URL)

    page.wait_for_load_state("networkidle")

    print("Report page loaded")


def export_excel(page):
    print("Opening Print menu...")
    page.click(config.PRINT_BUTTON_SELECTOR)
    page.wait_for_timeout(2000)

    print("Clicking Excel export and waiting for download...")

    # Auto-accept any alert/confirm dialog that appears before the download
    page.on("dialog", lambda dialog: dialog.accept())

    with page.expect_download(timeout=180000) as download_info:
        page.click(config.EXCEL_EXPORT_SELECTOR)

    download = download_info.value
    suggested = download.suggested_filename or "report.xlsx"
    download_path = Path(config.DOWNLOAD_DIR) / suggested
    download.save_as(str(download_path))

    print(f"Downloaded: {download_path}")
    return str(download_path)


def download_report():
    Path(config.DOWNLOAD_DIR).mkdir(exist_ok=True)

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        context = browser.new_context(
            accept_downloads=True
        )

        page = context.new_page()

        login(page)

        navigate_to_report(page)

        file_path = export_excel(page)

        browser.close()

        return file_path


def read_excel(file_path):
    print("Reading Excel file...")

    print("Extracting report metadata...")
    metadata = extract_report_metadata(file_path)

    print("Locating header row...")
    header_row = 3
    
    df = pd.read_excel(file_path, header=header_row)

    # Normalize column names to match SQL table
    df.columns = [
        str(col).strip()
        .replace(" ", "_")
        .replace("-", "_")
        .upper()
        for col in df.columns
    ]

    # Rename columns whose Excel names differ from SQL column names
    df.rename(columns={
        "CUSTOMER/INSTITUTION_NAME":  "CUSTOMER_INSTITUTION_NAME",
        "DATA_CONSUMED(GB)_APR_2026": "DATA_CONSUMED_GB_APR2026",
        "LAST_PAID_AMOUNT(RS)":       "LAST_PAID_AMOUNT_RS",
    }, inplace=True)

    print(f"Rows found: {len(df)}")
    return df


def convert_dates(df):
    """
    Convert date columns from DD-MM-YYYY string to proper Python date (MySQL DATE).
    '--' and any unparseable value become NULL.
    """
    date_cols = ["CONNECTION_DATE", "DISCONNECTION_DATE", "LAST_PAID_DATE"]

    for col in date_cols:
        if col not in df.columns:
            print(f"  [WARN] Date column '{col}' not found, skipping")
            continue

        # Replace '--' placeholder with NaN so pandas treats it as null
        df[col] = df[col].replace("--", pd.NA)

        before = df[col].notna().sum()
        df[col] = pd.to_datetime(df[col], format="%d-%m-%Y", errors="coerce")
        after  = df[col].notna().sum()

        failed = before - after
        if failed > 0:
            print(f"  [WARN] {col}: {failed} value(s) could not be parsed -> set to NULL")

        print(f"  {col}: {after} valid dates, {df[col].isna().sum()} NULLs")

    return df

def extract_report_metadata(file_path):
    """
    Extract report type, report date, and generated-at timestamp
    from the first two rows of the Excel file.
    Returns a dict — ready for future use (logging, DB, filenames etc.)
    """
    import re

    df_raw = pd.read_excel(file_path, header=None, nrows=2)
    row0 = str(df_raw.iloc[0, 0])
    row1 = str(df_raw.iloc[1, 0])

    # Row 0: "Gross Connection Report\n State :UTTARAKHAND ... Date : 02-06-2026"
    report_type  = row0.split("\n")[0].strip().replace("\r", "")
    date_match   = re.search(r'Date\s*:\s*(\d{2}-\d{2}-\d{4})', row0)
    report_date  = date_match.group(1) if date_match else None

    # Row 1: "Showing Records 1 to 25404 , Report Generated at : 03-06-2026 13:00:42"
    records_match   = re.search(r'Showing Records\s+\d+\s+to\s+(\d+)', row1)
    total_records   = int(records_match.group(1)) if records_match else None
    gen_match       = re.search(r'Report Generated at\s*:\s*([\d\-]+\s+[\d:]+)', row1)
    generated_at    = gen_match.group(1).strip() if gen_match else None

    metadata = {
        "report_type":   report_type,
        "report_date":   report_date,
        "total_records": total_records,
        "generated_at":  generated_at,
    }

    print(f"  Report Type : {report_type}")
    print(f"  Report Date : {report_date}")
    print(f"  Total Records: {total_records}")
    print(f"  Generated At: {generated_at}")

    return metadata

def upload_to_mysql(df):
    print("Converting date columns...")
    df = convert_dates(df)

    print("Connecting to MySQL...")

    connection_string = (
        f"mysql+pymysql://"
        f"{config.MYSQL_USER}:"
        f"{config.MYSQL_PASSWORD}@"
        f"{config.MYSQL_HOST}:"
        f"{config.MYSQL_PORT}/"
        f"{config.MYSQL_DATABASE}"
    )

    engine = create_engine(connection_string)

    print(f"Uploading to table: {config.TABLE_NAME}")

    df.to_sql(
        config.TABLE_NAME,
        con=engine,
        if_exists="replace",
        index=False,
        chunksize=1000
    )

    print(f"{len(df)} rows uploaded")


def main():
    try:

        print("=" * 50)
        print("REPORT DOWNLOAD STARTED")
        print("=" * 50)

        excel_file = download_report()

        df = read_excel(excel_file)

        upload_to_mysql(df)

        print("=" * 50)
        print("PROCESS COMPLETED")
        print("=" * 50)

    except Exception as e:

        print("=" * 50)
        print("ERROR")
        print("=" * 50)
        print(str(e))


if __name__ == "__main__":
   try:
    main()
   except Exception:
    traceback.print_exc()