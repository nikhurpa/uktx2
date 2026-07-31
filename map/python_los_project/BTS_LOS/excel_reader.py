import pandas as pd


def read_excel(config):

    bts = pd.read_excel(
        config.INPUT_EXCEL,
        sheet_name=config.BTS_SHEET
    )

    gp = pd.read_excel(
        config.INPUT_EXCEL,
        sheet_name=config.GP_SHEET
    )

    required = [
        config.LAT_COL,
        config.LON_COL
    ]

    for c in required:

        if c not in bts.columns:
            raise Exception(f"{c} missing in BTS sheet")

        if c not in gp.columns:
            raise Exception(f"{c} missing in GP sheet")

    return bts, gp