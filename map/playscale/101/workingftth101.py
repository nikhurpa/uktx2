from pathlib import Path
import time
import threading
import asyncio

import pandas as pd
from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy import text


import config2
import traceback
from datetime import date
REPORT_DATE = date(2026, 6, 6)

from datetime import datetime




# Download
DOWNLOAD_DIR = "downloads"

# MySQL


url="http://10.202.212.139/pls/apex/f?p=101:156:91807162505544::NO:::"
circle_selector = "#P156_CIRCLE"
ssa_selector = "#P156_SSA"
service_type_selector = "#P156_SERV_TYPE"
go_button_selector = "#P156_GO"
SSAs=[{"name":"DDN","df":None,"fname":None},{"name":"HWR","df":None,"fname":None},{"name":"KTD","df":None,"fname":None},{"name":"NNT","df":None,"fname":None},{"name":"NWT","df":None,"fname":None},{"name":"AMO","df":None,"fname":None}]
REPORT_DATE = date.today()
current_date = REPORT_DATE.strftime("%m%d%Y")


def navigate_to_report(page, ssa):
  


    # page.wait_for_load_state("networkidle")

    # Select Options
    page.select_option(circle_selector, label="UT")
    page.locator(ssa_selector).select_option(label=ssa['name'])
    page.locator(service_type_selector).select_option(label="BHARAT FIBER BB")
    
    # Click GO button
    page.locator(go_button_selector).click()
    page.wait_for_timeout(5000)
    # page.wait_for_load_state("networkidle")

    print("Clicking CSV export and waiting for download...")

    # download_button = page.get_by_text(
    #     "DOWNLOAD",
    #     exact=True
    # ).nth(0)

    with page.expect_download(timeout=360000) as download_info:
        page.get_by_text("DOWNLOAD", exact=True).nth(0).click()

    download = download_info.value
    download.path()   # wait until fully completed

    suggested = f"report{current_date}_{ssa['name']}.csv"
    download_path = Path(DOWNLOAD_DIR) / suggested
    download.save_as(str(download_path))
    page.wait_for_timeout(2000)

    print(f"Downloaded: {download_path}")
    return str(download_path)

def _download_report_worker(result):
    """Core Playwright logic — always called inside a dedicated thread."""
    Path(DOWNLOAD_DIR).mkdir(exist_ok=True)

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
        )

        context = browser.new_context(
            accept_downloads=True
        )

        page = context.new_page()

        page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=120000
        )
        page.wait_for_timeout(3000)

        page.locator("#P156_UPDATE").wait_for(timeout=10000)

        page.wait_for_timeout(3000)
        text = page.locator("#P156_UPDATE").first.get_attribute("value")
        print(f"Text = [{text}]")
        formatted = datetime.strptime(
            text,
            "%d-%b-%y"
        ).strftime("%m%d%Y")

        print(f"Formatted Date = [{formatted}]")

        for ssa in SSAs:
            print(f"Processing for SSA: {ssa['name']}")
            file_path = navigate_to_report(page, ssa)
            ssa['df'] = read_report(file_path, ssa['name'])
            ssa['fname'] = file_path

        browser.close()
        result['formatted'] = formatted


def download_report():
    """Spawns Playwright in a thread with a brand-new event loop.

    Anaconda sets a global asyncio event loop on the main thread.
    Playwright's sync API calls loop.run_until_complete() internally,
    which raises 'This event loop is already running' if any loop is
    already active. Creating a fresh loop inside a new thread sidesteps
    this entirely.
    """
    result = {}
    exc_holder = {}

    def run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            _download_report_worker(result)
        except Exception as e:
            exc_holder['error'] = e
        finally:
            loop.close()

    t = threading.Thread(target=run)
    t.start()
    t.join()

    if 'error' in exc_holder:
        raise exc_holder['error']

    return result['formatted']


def read_report(file_path, ssa_name):
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



def create_table_if_not_exists(engine, table_name):
    """
    Create monthly table from template table.
    """

  
    template_table = "working_ftth"


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

    create_table_if_not_exists(engine, table_name)

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

        rep_date= download_report()
    

        table_name=f"working_ftth_{rep_date}"
        for ssa in SSAs:
          
             if ssa['df'] is not None:
                 print(f"Uploading report: {ssa['name']} from file {ssa['fname']}")
                 upload_to_mysql(ssa['df'], table_name)

       

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