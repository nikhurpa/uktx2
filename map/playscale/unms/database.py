import pymysql
from pymysql.err import OperationalError, InternalError
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def check_db_connectivity(host, user, password, database, port=3306, timeout=5):
    """
    Checks the connectivity to a MySQL database server.
    Returns True if successful, False otherwise.
    """
    print(f"🔄 Attempting to connect to MySQL server at {host}:{port}...")
    connection = None
    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port,
            connect_timeout=timeout # Prevents the script from hanging indefinitely
        )
        print("✅ Connection successful! Database is reachable.")
        return True

    except OperationalError as e:
        error_code = e.args[0]
        print(f"❌ Connection Failed (Operational Error {error_code}):")
        
        # Handle the specific getaddrinfo / host string error
        if "getaddrinfo failed" in str(e):
            print("   👉 Check your 'host' parameter. Do not include '@' or usernames in it.")
        elif error_code == 2003:
            print("   👉 Server is unreachable. Check the IP address, server firewall, or port 3306.")
        elif error_code == 1045:
            print("   👉 Access denied. Check your username or password.")
        else:
            print(f"   👉 {e}")
        return False

    except InternalError as e:
        print(f"❌ Database Internal Error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return False

    finally:
        # Always clean up and close the connection if it succeeded
        if connection:
            connection.close()

# --- HOW TO USE IT ---
if __name__ == "__main__":
    # Correctly separated parameters based on your previous error
    # DB_HOST = "193.203.184.96"  # Just the IP address
    # DB_USER = "01"              # Your actual database user
    # DB_PASS = "your_actual_password"
    # DB_NAME = "your_database_name"

    MYSQL_USER = "u642970219_uktx"
    MYSQL_PASSWORD = "Gmcfa@01"
    MYSQL_HOST = "srv1493.hstgr.io"
    MYSQL_PORT = 3306
    MYSQL_DATABASE = "u642970219_TRANSMISSION1"

    # Run the pre-check
    is_connected = check_db_connectivity(
        host=MYSQL_HOST, 
        user=MYSQL_USER, 
        password=MYSQL_PASSWORD, 
        database=MYSQL_DATABASE
    )

    if is_connected:
        print("🚀 Proceeding with the main application...")
        # Put your main script logic or query executions here
    else:
        print("🛑 Script stopped: Please fix the database connection issue first.")