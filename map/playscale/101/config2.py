# config2.py



# Selectors
DISCON_FROM_DATE_SELECTOR = "#P527_FROM_DATE"
DISCON_TO_DATE_SELECTOR = "#P527_TO_DATE"
PROV_FROM_DATE_SELECTOR = "#P527_FROM_DATE"
PROV_TO_DATE_SELECTOR = "#P527_TO_DATE"

# Website
REPORT_URL = [
    { "name":"OLT IP WISE PROVISIONING REPORT",
      "url":"http://10.202.212.139/pls/apex/f?p=101:519:91807162505544::NO:::",
      "table":"ftth_provisioning",
      "df":None,
      "fname":"" ,
      "from_date_selector": "#P519_FROM_DATE",
      "to_date_selector": "#P519_TO_DATE",
      "go_button_selector": "#P519_GO"


    },
    { "name":"OLT IP WISE DISCONNECTION REPORT",
      "url":"http://10.202.212.139/pls/apex/f?p=101:527:91807162505544::NO:::",
      "table":"ftth_disconnection",
      "df":None,
      "fname":"",
      "from_date_selector": "#P527_FROM_DATE",
      "to_date_selector": "#P527_TO_DATE",
      "go_button_selector": "#P527_GO"

    }
]


# Download
DOWNLOAD_DIR = "downloads"

# MySQL
MYSQL_USER = "uktx"
MYSQL_PASSWORD = "uktx123"
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_DATABASE = "ukcfa"




