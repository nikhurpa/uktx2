from pathlib import Path
import time

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
SSAs=[{"name":"NNT","df":None,"fname":None},{"name":"NWT","df":None,"fname":None},{"name":"AMO","df":None,"fname":None},{"name":"DDN","df":None,"fname":None},{"name":"HWR","df":None,"fname":None},{"name":"KTD","df":None,"fname":None}]
REPORT_DATE = date.today()
current_date = REPORT_DATE.strftime("%m%d%Y")


def download_report():
    Path(DOWNLOAD_DIR).mkdir(exist_ok=True)

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
        )

        context = browser.new_context(
            accept_downloads=True
        )

        page = context.new_page()

        # # page.goto(url)
        # page.goto(
        #     url,
        #     wait_until="domcontentloaded",
        #     timeout=120000
        # )
        # page.wait_for_timeout(3000)
        
        # page.locator("#P156_UPDATE").wait_for(timeout=10000)

        # page.wait_for_timeout(3000)
        # # text = page.locator("#P156_UPDATE").inner_text().strip()
        # text = page.locator("#P156_UPDATE").first.get_attribute("value")
        # print(f"Text = [{text}]")
        # formatted = datetime.strptime(
        #     # page.locator("#P156_UPDATE").input_value().strip().title(),
        #     text,
        #     "%d-%b-%y"
        # ).strftime("%d%m%Y")
        
        # table_name=f"working_ftth_{formatted}"
        # print(f"Formatted Date = [{table_name}]")

        # page.select_option(circle_selector, label="UT")
        
        # page.locator(service_type_selector).select_option(label="BHARAT FIBER BB")

        for ssa in SSAs:

             # page.goto(url)
            page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=120000
            )
            page.wait_for_timeout(3000)
            
            page.locator("#P156_UPDATE").wait_for(timeout=10000)

            page.wait_for_timeout(3000)
            # text = page.locator("#P156_UPDATE").inner_text().strip()
            text = page.locator("#P156_UPDATE").first.get_attribute("value")
            print(f"Text = [{text}]")
            formatted = datetime.strptime(
                # page.locator("#P156_UPDATE").input_value().strip().title(),
                text,
                "%d-%b-%y"
            ).strftime("%d%m%Y")
            
            table_name=f"working_ftth_{formatted}"
            print(f"Formatted Date = [{table_name}]")

            page.select_option(circle_selector, label="UT")
            
            page.locator(service_type_selector).select_option(label="BHARAT FIBER BB")



            print(f"Processing for SSA: {ssa['name']}")
            page.locator(ssa_selector).select_option(label=ssa['name'])
            # Click GO button
            # page.locator(go_button_selector).click()
            page.locator("#P156_GO").click(force=True, no_wait_after=True)
            page.wait_for_timeout(9000)
            # page.wait_for_timeout(5000)
            # page.wait_for_load_state("networkidle")
           

            download_button = page.get_by_text("DOWNLOAD",exact=True).nth(0)

            print("Clicking CSV export and waiting for download...")
            with page.expect_download(timeout=180000) as download_info:
                download_button.click(force=True)
                # page.wait_for_timeout(90000)

            download = download_info.value
            # download.path()   # wait until fully completed

            suggested = f"report{formatted}_{ssa['name']}.csv"
            download_path = Path(DOWNLOAD_DIR) / suggested
            download.save_as(str(download_path))
            # page.wait_for_timeout(2000)

            print(f"Downloaded: {download_path}")
                     
            ssa['fname'] = download_path

        browser.close()    

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

        download_report()
    
        for ssa in SSAs:
             print(f"Reading report: {ssa['name']} from file {ssa['fname']}")
             ssa['df'] = read_report(ssa['fname'], ssa['name'])
             if ssa['df'] is not None:
                 print(f"Uploading report: {ssa['name']} from file {ssa['fname']}")
                 upload_to_mysql(ssa['df'], config2.TABLE_NAME)

       

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