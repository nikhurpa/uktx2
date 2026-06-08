from pathlib import Path
import time

import pandas as pd
from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy import text
from sqlalchemy.dialects.mysql import insert

import config2
import traceback
from datetime import date


from urllib.parse import quote_plus

REPORT_DATE = date(2026, 6, 8)

def login(page):
    print("Opening login page...")

    page.goto(config2.LOGIN_URL,    
              wait_until="domcontentloaded",
              timeout=60000
    )

    page.fill(
        config2.USERNAME_SELECTOR,
        config2.USERNAME
    )

    page.fill(
        config2.PASSWORD_SELECTOR,
        config2.PASSWORD
    )

    page.click(
        config2.LOGIN_BUTTON_SELECTOR
    )
    page.wait_for_load_state("domcontentloaded")

    print("Login successful")
    # Auto-accept any alert/confirm dialog that appears before the download
    page.on("dialog", lambda dialog: dialog.accept())


def navigate_to_report(page, report_url):
    print(f"Opening report page...: {report_url}")

    page.goto(report_url)

    page.wait_for_load_state("networkidle")

    print("Report page loaded")

    page.click(config2.PRINT_BUTTON_SELECTOR)
    page.wait_for_timeout(2000)

    print("Clicking Excel export and waiting for download...")

    with page.expect_download(timeout=180000) as download_info:
        page.click(config2.EXCEL_EXPORT_SELECTOR)

    download = download_info.value
    suggested = download.suggested_filename or "report.xlsx"
    download_path = Path(config2.DOWNLOAD_DIR) / suggested
    download.save_as(str(download_path))

    print(f"Downloaded: {download_path}")
    return str(download_path)


def download_report():
    Path(config2.DOWNLOAD_DIR).mkdir(exist_ok=True)

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
        )

        context = browser.new_context(
            accept_downloads=True
        )

        page = context.new_page()

        login(page)

        for report in config2.REPORT_URL:
            print(f"Processing report: {report['name']}")
          
            if report['name'] == "ftth_gross_hist_report":
                dformat = REPORT_DATE.strftime("%Y-%m-%d")
                file_path = navigate_to_report(page,report['url'].format(date=dformat))
            else:
                d1format = REPORT_DATE.strftime("01-%Y")
                d2format = REPORT_DATE.strftime("%m-%Y")
                file_path = navigate_to_report(page,report['url'].format(fdate=d1format, tdate=d2format))

                
            report['df'] = read_excel(file_path, report['name'])
            report['fname'] = file_path
           


        browser.close()

        return file_path


def read_excel(file_path, report_name):
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
        "CUSTOMER/INSTITUTION_NAME": "CUSTOMER_INSTITUTION_NAME",
        # "DATA_CONSUMED(GB)_APR_2026": "DATA_CONSUMED_GB_APR2026",
        "LAST_PAID_AMOUNT(RS)": "LAST_PAID_AMOUNT_RS",
         }, inplace=True)

    for col in df.columns:
        if col.startswith("DATA_CONSUMED(GB)_"):
            df.rename(
                columns={col: "DATA_CONSUMED_GB"},
                inplace=True
            )

        if col.endswith(f"_{REPORT_DATE.year}"):
            new_col = col.replace(f"_{REPORT_DATE.year}", "")
            df.rename(columns={col: new_col}, inplace=True)    
  

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


def create_table_if_not_exists(engine, table_name):
    """
    Create monthly table from template table.
    """

    if table_name.startswith("bnu_ftth_"):
        template_table = "bnu_ftth"

    elif table_name.startswith("gp_avl_"):
        template_table = "gp_avl"

    else:
        raise ValueError(
            f"No template configured for {table_name}"
        )

    # sql = f"""
    # CREATE TABLE IF NOT EXISTS `{table_name}`
    # LIKE `{template_table}`;
    # """

    with engine.begin() as conn:
        # Drope old data
        conn.execute(text(f"""
            DROP TABLE IF EXISTS `{table_name}`
        """))
                
            # Create table if missing
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS `{table_name}`
            LIKE `{template_table}`
        """))

      
    print(
        f"Table checked/created: {table_name}"
    )


def upload_to_mysql(df, table_name):
    print("Converting date columns...")
    df = convert_dates(df)

    if table_name.startswith("bnu_ftth_"):
        df = df.drop_duplicates(
            subset=["CUSTOMER_ID"],
            keep="first"
        )


    print("Connecting to MySQL...")
    connection_string = (
        f"mysql+pymysql://{config2.MYSQL_USER}:"
        f"{config2.MYSQL_PASSWORD}@"
        f"{config2.MYSQL_HOST}:{config2.MYSQL_PORT}/"
        f"{config2.MYSQL_DATABASE}"
    )
    print(connection_string)



    url = URL.create(
    "mysql+pymysql",
    username=config2.MYSQL_USER,
    password=config2.MYSQL_PASSWORD,
    host=config2.MYSQL_HOST,
    port=config2.MYSQL_PORT,
    database=config2.MYSQL_DATABASE,
    )

    print(url)

    engine = create_engine(url)

    with engine.connect() as conn:
        print("Connected successfully")


    # engine = create_engine(connection_string)
    create_table_if_not_exists(engine, table_name)
    print(f"Uploading to table: {table_name}")

    df.to_sql(
        table_name,
        con=engine,
        if_exists="append",
        index=False,
        chunksize=1000,
        method=insert_ignore
    )

    print(f"{len(df)} rows uploaded")

def insert_ignore(table, conn, keys, data_iter):
    data = [dict(zip(keys, row)) for row in data_iter]

    stmt = insert(table.table).values(data)
    stmt = stmt.prefix_with("IGNORE")

    conn.execute(stmt)

def main():
    try:

        print("=" * 50)
        print("REPORT DOWNLOAD STARTED")
        print("=" * 50)

        download_report()
        
        for report in config2.REPORT_URL:
             tformat = REPORT_DATE.strftime("%m%Y") if report['name'] == "ftth_gross_hist_report" else REPORT_DATE.strftime("%Y")
             if report['df'] is not None:
                 print(f"Uploading report: {report['name']} from file {report['fname']}")
                 upload_to_mysql(report['df'], report['table'].format(date=tformat))

       

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