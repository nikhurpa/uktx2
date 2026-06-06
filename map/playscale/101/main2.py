from pathlib import Path
import time

import pandas as pd
from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine

import config2
import traceback
from datetime import date
REPORT_DATE = date(2026, 6, 6)
from sqlalchemy import text



def navigate_to_report(page, report):
    print(f"Opening report page...: {report['url']}")

    page.goto(report['url'])

    page.wait_for_load_state("networkidle")

    # Set dates
    page.locator(report['from_date_selector']).fill("01-May-2026")
    page.locator(report['to_date_selector']).fill("31-May-2026")


    # Click GO button
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

    date_cols = [
        "DATED"
    ]

    for col in date_cols:

        if col not in df.columns:
            continue

        df[col] = df[col].replace("--", pd.NA)

        df[col] = pd.to_datetime(
            df[col],
            format="%d-%b-%Y",
            errors="coerce"
        ).dt.date

    return df

def upload_to_mysql(df, table_name):
   
    df = convert_dates(df)

    print("Connecting to MySQL...")

    connection_string = (
        f"mysql+pymysql://"
        f"{config2.MYSQL_USER}:"
        f"{config2.MYSQL_PASSWORD}@"
        f"{config2.MYSQL_HOST}:"
        f"{config2.MYSQL_PORT}/"
        f"{config2.MYSQL_DATABASE}"
    )

    engine = create_engine(connection_string)
  
    print(f"Uploading to table: {table_name}")

    df.to_sql(
        table_name,
        con=engine,
        if_exists="append",
        index=False,
        chunksize=1000
    )

    print(f"{len(df)} rows uploaded")


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