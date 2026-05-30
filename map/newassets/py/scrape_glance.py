"""
BSNL TEEVRA - Glance Page Scraper
Scrapes TIP-OLT AT A GLANCE and TIP-BAF AT A GLANCE tables
and saves them as CSV files.

Usage:
    pip install playwright
    playwright install chromium
    python scrape_glance.py

Configure credentials and URL at the top of this file.
"""

import csv
import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
BASE_URL   = "http://10.132.37.10:8081"
USERNAME   = "199704084"          # <-- change if needed
PASSWORD   = "12345"      # <-- fill in your password

# Glance filter selections (set to None to leave as default)
CIRCLE     = "UTTRANCHAL"         # Circle dropdown value
BA         = None                 # None = leave as "-- ALL --"
SSA        = None                 # None = leave as "-- ALL --"

# Which tab to scrape in each modal: "OFFLINE ELEMENTS" or "TOTAL ELEMENTS"
TAB        = "TOTAL ELEMENTS"

OUTPUT_OLT = "tip_olt_glance.csv"
OUTPUT_BAF = "tip_baf_glance.csv"
# ──────────────────────────────────────────────────────────────────────────────


def login(page):
    """Log in to BSNL TEEVRA."""
    print("→ Navigating to login page...")
    page.goto(f"{BASE_URL}/", wait_until="networkidle")

    page.fill('input[type="text"], input[name="username"], input#username', USERNAME)
    page.fill('input[type="password"], input[name="password"], input#password', PASSWORD)
    page.click('button:has-text("LOGIN"), input[type="submit"]')

    # Wait for dashboard/glance to load
    page.wait_for_url(lambda url: "login" not in url.lower(), timeout=15000)
    print("✓ Logged in successfully.")


def go_to_glance(page):
    """Navigate to the Glance page and apply filters."""
    print("→ Navigating to Glance page...")
    page.goto(f"{BASE_URL}/glance", wait_until="domcontentloaded")
    page.wait_for_selector("text=ELEMENTS STATUS", timeout=15000)

    # Select Circle if specified
    if CIRCLE:
        circle_sel = page.locator('select').filter(has_text="").nth(0)
        # Try to find by nearby label text
        try:
            page.select_option('select[name*="circle"], select[id*="circle"]', label=CIRCLE)
        except Exception:
            # Fallback: select first select element
            page.locator('select').first.select_option(label=CIRCLE)
        print(f"  Circle set to: {CIRCLE}")

    # Click Submit
    page.click('button:has-text("Submit")')
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    print("✓ Glance page loaded with filters applied.")


def scrape_table(page, card_text, tab_text, output_file):
    """
    Click a card on the Glance page, switch to the desired tab,
    set records to All, then scrape all table rows to CSV.
    """
    print(f"\n→ Opening '{card_text}' modal...")

    # Click the card (the colored badge with the element type text)
    page.click(f'text="{card_text}"')
    
    # Wait for modal/dialog to appear
    page.wait_for_selector(f'text="{card_text} AT A GLANCE"', timeout=10000)
    time.sleep(0.5)

    # Click the correct tab (OFFLINE ELEMENTS / TOTAL ELEMENTS)
    print(f"  Switching to tab: {tab_text}")
    page.click(f'button:has-text("{tab_text}"), a:has-text("{tab_text}")')
    time.sleep(0.8)

    # Set "Show X records" to All to load everything at once
    print("  Setting records per page to All...")
    try:
        # DataTables uses a <select> with options like 10, 25, 50, 100, All
        records_select = page.locator('select').filter(has=page.locator('option[value="-1"], option:has-text("All")'))
        if records_select.count() > 0:
            records_select.first.select_option("-1")
            page.wait_for_load_state("networkidle")
            time.sleep(1)
        else:
            # Try selecting by nearby "records" label
            page.select_option('select + text="records"', "-1")
    except Exception as e:
        print(f"  ⚠ Could not set All records: {e}. Will paginate instead.")

    # Get table headers
    print("  Reading table headers...")
    headers = page.locator('table thead th').all_text_contents()
    headers = [h.strip() for h in headers if h.strip()]
    print(f"  Columns: {headers}")

    # Scrape all rows — handle pagination if needed
    all_rows = []
    page_num = 1

    while True:
        rows = page.locator('table tbody tr').all()
        
        for row in rows:
            cells = row.locator('td').all_text_contents()
            cells = [c.strip() for c in cells]
            if cells and any(cells):  # skip empty rows
                all_rows.append(cells)

        print(f"  Page {page_num}: {len(rows)} rows scraped (total so far: {len(all_rows)})")

        # Check if there's a "Next" pagination button that's not disabled
        next_btn = page.locator('a.paginate_button.next:not(.disabled), button.paginate_button.next:not(.disabled)')
        if next_btn.count() > 0 and next_btn.first.is_visible():
            next_btn.first.click()
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)
            page_num += 1
        else:
            break  # No more pages

    # Write CSV
    print(f"  Writing {len(all_rows)} rows to {output_file}...")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(all_rows)

    print(f"✓ Saved: {output_file} ({len(all_rows)} rows, {len(headers)} columns)")

    # Close modal
    try:
        page.keyboard.press("Escape")
        time.sleep(0.3)
        close_btn = page.locator('button.close, button[aria-label="Close"], .modal .close')
        if close_btn.count() > 0:
            close_btn.first.click()
        time.sleep(0.5)
    except Exception:
        pass


def main():
    with sync_playwright() as p:
        # Launch browser — set headless=False to watch it run
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            ignore_https_errors=True,  # site uses HTTP, no cert issues
            viewport={"width": 1400, "height": 900}
        )
        page = context.new_page()

        try:
            login(page)
            go_to_glance(page)

            # Scrape TIP OLT
            scrape_table(page, "TIP OLT", TAB, OUTPUT_OLT)

            # Go back to glance page and re-submit to reset the view
            go_to_glance(page)

            # Scrape TIP BAF
            scrape_table(page, "TIP BAF", TAB, OUTPUT_BAF)

            print("\n✅ Done! Files saved:")
            print(f"   • {OUTPUT_OLT}")
            print(f"   • {OUTPUT_BAF}")

        except PlaywrightTimeout as e:
            print(f"\n❌ Timeout error: {e}")
            page.screenshot(path="error_screenshot.png")
            print("   Screenshot saved to error_screenshot.png")
        except Exception as e:
            print(f"\n❌ Error: {e}")
            page.screenshot(path="error_screenshot.png")
            print("   Screenshot saved to error_screenshot.png")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
