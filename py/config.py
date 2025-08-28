#!/usr/bin/env python3
"""
Configuration file for KMZ Polyline Processor
"""

# Database Configuration
DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'TRANSMISSION1',
    'user': 'uktx',
    'password': 'uktx123',
    'charset': 'utf8mb4',
    'port': 3306,
    'autocommit': True
}

# KMZ Files Folder Path
# Update this path to point to your folder containing KMZ files
KMZ_FOLDER_PATH = r"C:\www5\AdminLTE-3.2.0\bnuknd\kml\kmz1"

# Processing Options
MAX_COORDINATES_PER_POLYLINE = 10000  # Limit to prevent extremely large polylines
SKIP_EMPTY_POLYLINES = True  # Skip polylines with no coordinates
CREATE_INDEXES = True  # Create database indexes for better performance
INCLUDE_START_END_COORDS = True  # Include start and end coordinates in database

# Logging Configuration
LOG_LEVEL = 'INFO'  # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE = 'kmz_processor.log'
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'

# Database Table Configuration
TABLE_NAME = 'polylines'
TABLE_ENGINE = 'InnoDB'
TABLE_CHARSET = 'utf8mb4'
TABLE_COLLATION = 'utf8mb4_unicode_ci'
