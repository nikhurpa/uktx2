from pathlib import Path
import pandas as pd

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.dialects.mysql import insert
from sqlalchemy import text

import config2


def get_engine():
    url = URL.create(
        "mysql+pymysql",
        username=config2.MYSQL_USER,
        password=config2.MYSQL_PASSWORD,
        host=config2.MYSQL_HOST,
        port=config2.MYSQL_PORT,
        database=config2.MYSQL_DATABASE,
    )

    return create_engine(url)


def clean_columns(df):
    df.columns = [
        str(col).strip()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .upper()
        for col in df.columns
    ]

    df["INST_DATE"] = pd.to_datetime(
        df["INST_DATE"].astype(str).str.title(),
        format="%d-%b-%y",
        errors="coerce"
        )

    return df


def upload_file(file_path, engine):

    print(f"Reading: {file_path}")

    df = pd.read_csv(
        file_path,
        encoding="cp1252",
        low_memory=False
    )

    df = clean_columns(df)

    print(f"Rows found: {len(df)}")

    df.to_sql(
        config2.TABLE_NAME,
        con=engine,
        if_exists="append",
        index=False,
        chunksize=1000,
        method=insert_ignore
    )



    print(f"Uploaded: {file_path.name}")

def insert_ignore(table, conn, keys, data_iter):
    data = [dict(zip(keys, row)) for row in data_iter]

    stmt = insert(table.table).values(data)
    stmt = stmt.prefix_with("IGNORE")

    conn.execute(stmt)

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


def main():

    engine = get_engine()

    csv_files = list(
        Path(config2.CSV_FOLDER).glob("*.csv")
    )

    print(f"CSV files found: {len(csv_files)}")


    create_table_if_not_exists(engine, config2.TABLE_NAME)
    
    for file_path in csv_files:
        try:
            upload_file(file_path, engine)

        except Exception as e:
            print(f"Failed: {file_path.name}")
            print(e)

    print("Completed")


if __name__ == "__main__":
    main()