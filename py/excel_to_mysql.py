import pandas as pd
from sqlalchemy import create_engine, text
import sys

def excel_to_mysql(excel_file, db_host, db_user, db_password, db_name, table_name):
    """
    Reads data from an Excel file and inserts it into a MySQL database table.

    The first row of the Excel file is used to create the column names in the database table.

    Args:
        excel_file (str): The file path of the Excel file.
        db_host (str): The hostname or IP address of the MySQL server.
        db_user (str): The username to connect to the MySQL server.
        db_password (str): The password for the MySQL user.
        db_name (str): The name of the database to connect to.
        table_name (str): The name of the table to be created and into which data will be inserted.
    """
    try:
        # Step 1: Read the Excel file into a pandas DataFrame
        # The first row is automatically used as column headers. [6, 15, 18]
        df = pd.read_excel(excel_file)

        # Clean up column names to be valid for MySQL
        df.columns = df.columns.str.strip().str.replace(' ', '_').str.replace('[^a-zA-Z0-9_]', '', regex=True)

        # Step 2: Create a connection to the MySQL database using SQLAlchemy
        # The connection string format is 'mysql+mysqlconnector://user:password@host/database_name'
        engine = create_engine(f"mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}")

        with engine.connect() as connection:
            # Optional: Drop the table if it already exists to start fresh
            print(f"Dropping table `{table_name}` if it exists...")
            connection.execute(text(f"DROP TABLE IF EXISTS `{table_name}`"))
            print("Table dropped.")

            # Step 3: Use the to_sql() method to create the table and insert the data. [13, 17]
            # The column names from the DataFrame are used to create the table columns.
            print(f"Creating table `{table_name}` and inserting data...")
            df.to_sql(name=table_name, con=engine, if_exists='replace', index=False)
            print("Data inserted successfully.")

            # Verify the data insertion
            result = connection.execute(text(f"SELECT COUNT(*) FROM `{table_name}`"))
            count = result.scalar()
            print(f"Verification: Found {count} rows in `{table_name}`.")

    except FileNotFoundError:
        print(f"Error: The file '{excel_file}' was not found.", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)

if __name__ == '__main__':
    # --- Configuration ---
    # Database connection details
    DB_HOST = 'localhost'
    DB_USER = 'uktx'
    DB_PASSWORD = 'uktx123'
    DB_NAME = 'TRANSMISSION1'

    # Excel file path and table name
    EXCEL_FILE_PATH = r'C:\wamp64\www\uktx\py\BTS.xlsx'
    TABLE_NAME = 'bts'
    # -------------------

    excel_to_mysql(EXCEL_FILE_PATH, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, TABLE_NAME)