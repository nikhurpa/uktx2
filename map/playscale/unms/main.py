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
    """
    Print
      -> Export Report (MS Excel)
      -> All Pages
      -> Export
    """

    print("Opening Print menu...")

    page.click(config.PRINT_BUTTON_SELECTOR)

    page.wait_for_timeout(1000)

    print("Selecting Excel export...")

    page.on("dialog", lambda dialog: dialog.accept())

    with page.expect_download(timeout=180000) as download_info:
        page.click(config.EXCEL_EXPORT_SELECTOR)


    # Give server time to generate report
    page.wait_for_timeout(5000)

    download = download_info.value

    download_path = (
        Path(config.DOWNLOAD_DIR)
        # download.suggested_filename
    )

    download.save_as(str(download_path))

    print(
        f"Downloaded: {download_path}"
    )

    return str(download_path)


def download_report():
    Path(
        config.DOWNLOAD_DIR
    ).mkdir(
        exist_ok=True
    )

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
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

    df = pd.read_excel(file_path)

    df.columns = [
        str(col)
        .strip()
        .replace(" ", "_")
        .replace("-", "_")
        for col in df.columns
    ]

    print(
        f"Rows found: {len(df)}"
    )

    return df


def upload_to_mysql(df):
    print("Connecting to MySQL...")

    connection_string = (
        f"mysql+pymysql://"
        f"{config.MYSQL_USER}:"
        f"{config.MYSQL_PASSWORD}@"
        f"{config.MYSQL_HOST}:"
        f"{config.MYSQL_PORT}/"
        f"{config.MYSQL_DATABASE}"
    )

    engine = create_engine(
        connection_string
    )

    print(
        f"Uploading to table: "
        f"{config.TABLE_NAME}"
    )

    df.to_sql(
        config.TABLE_NAME,
        con=engine,
        if_exists="append",
        index=False,
        chunksize=1000
    )

    print(
        f"{len(df)} rows uploaded"
    )


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