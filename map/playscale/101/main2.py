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
REPORT_DATE = date(2026, 5, 31)




def navigate_to_report(page, report):
    print(f"Opening report page...: {report['url']}")

    # page.goto(report['url'])

    page.goto(
    report['url'],
    wait_until="domcontentloaded",
    timeout=120000
)

    page.wait_for_load_state("networkidle")

    # Set dates
    print(f"Setting dated ")
    page.locator(report['from_date_selector']).fill("01-May-2026")
    page.locator(report['to_date_selector']).fill("31-May-2026")


    # Click GO button
    print(f"Clicking GO button")
    page.locator(report['go_button_selector']).click()
    page.wait_for_load_state("networkidle")

    # Click first UT hyperlink
    report_region = page.locator(
        "text='OLT IP WISE PROVISIONING REPORT'"
    )

    page.locator("a[href*='f?p=101']", has_text="UT").nth(0).click()

    page.wait_for_load_state("networkidle")


    print("Clicking CSV export and waiting for download...")

    with page.expect_download(timeout=180000) as download_info:
        page.get_by_text("Download", exact=True).nth(2).click()

    download = download_info.value
    suggested = download.suggested_filename or "report.csv"
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

   

        for report in config2.REPORT_URL:
            print(f"Processing report: {report['name']}")
          
            file_path = navigate_to_report(page,report)
                          
            report['df'] = read_report(file_path, report['name'])
            report['fname'] = file_path
           


        browser.close()

        return file_path


def read_report(file_path, report_name):
    print("Reading CSV file...")

    df = pd.read_csv(
        file_path,
        header=0,          # same as header_row = 3
        encoding="utf-8",
        low_memory=False
    )

    df.columns = [
        str(col).strip()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .upper()
        for col in df.columns
    ]

    print(f"Rows found: {len(df)}")
    return df



def convert_dates(df):

    df["DATED"] = pd.to_datetime(
        df["DATED"].astype(str).str.title(),
        format="%d-%b-%y",
        errors="coerce"
        )

    return df

def upload_to_mysql(df, table_name):
   
    df = convert_dates(df)

    print("Connecting to MySQL...")

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
          
             if report['df'] is not None:
                 print(f"Uploading report: {report['name']} from file {report['fname']}")
                 upload_to_mysql(report['df'], report['table'])

       

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