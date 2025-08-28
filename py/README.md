# KMZ Polyline Processor

This Python application reads KMZ files, extracts polylines, converts them to Google encoded format, and stores them in a MySQL database.

## Features

- **KMZ File Processing**: Automatically processes all `.kmz` files in a specified folder
- **Polyline Extraction**: Extracts LineString geometries from KML content
- **Google Encoding**: Converts coordinates to Google's encoded polyline format
- **Database Storage**: Stores polyline data in MySQL with metadata
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Configuration Management**: Easy customization through config file
- **Error Handling**: Robust error handling and validation

## Files

- `kmz_polyline_processor.py` - Basic version with hardcoded settings
- `kmz_processor_with_config.py` - Advanced version using configuration file
- `config.py` - Configuration file for database and processing settings
- `requirements.txt` - Python package dependencies
- `README.md` - This documentation file

## Requirements

- Python 3.7 or higher
- MySQL database server
- Internet connection (for package installation)

## Installation

1. **Install Python packages**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Update configuration**:
   - Edit `config.py` and update the `KMZ_FOLDER_PATH` to point to your KMZ files folder
   - Update database connection details if needed

3. **Verify database connection**:
   - Ensure MySQL server is running
   - Verify database credentials in `config.py`

## Database Schema

The script creates a `polylines` table with the following structure:

```sql
CREATE TABLE polylines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kmz_filename VARCHAR(255) NOT NULL,
    polyline_name VARCHAR(255),
    polyline_description TEXT,
    google_encoded_polyline TEXT NOT NULL,
    coordinates_count INT,
    start_lat DECIMAL(10, 8),
    start_lng DECIMAL(11, 8),
    end_lat DECIMAL(10, 8),
    end_lng DECIMAL(11, 8),
    bounding_box TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_filename (kmz_filename),
    INDEX idx_created_at (created_at),
    INDEX idx_start_coords (start_lat, start_lng),
    INDEX idx_end_coords (end_lat, end_lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### Field Descriptions:

- **id**: Unique identifier for each polyline
- **kmz_filename**: Source KMZ file name
- **polyline_name**: Name of the polyline from KML
- **polyline_description**: Description from KML (if available)
- **google_encoded_polyline**: Google encoded polyline string
- **coordinates_count**: Number of coordinate points in the polyline
- **start_lat**: Starting latitude (first coordinate)
- **start_lng**: Starting longitude (first coordinate)
- **end_lat**: Ending latitude (last coordinate)
- **end_lng**: Ending longitude (last coordinate)
- **bounding_box**: Bounding box coordinates (min_lon,min_lat,max_lon,max_lat)
- **created_at**: When the record was created
- **updated_at**: When the record was last updated

## Usage

### Basic Usage

```bash
python kmz_polyline_processor.py
```

### Configuration-based Usage (Recommended)

```bash
python kmz_processor_with_config.py
```

### Command Line Options

You can also run the script with custom parameters by modifying the main function.

## Configuration Options

### Database Settings (`config.py`)

```python
DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'TRANSMISSION1',
    'user': 'uktx',
    'password': 'uktx123',
    'charset': 'utf8mb4',
    'port': 3306,
    'autocommit': True
}
```

### Processing Settings

```python
# KMZ folder path
KMZ_FOLDER_PATH = r"C:\path\to\your\kmz\files"

# Processing limits
MAX_COORDINATES_PER_POLYLINE = 10000
SKIP_EMPTY_POLYLINES = True
CREATE_INDEXES = True

# Logging
LOG_LEVEL = 'INFO'
LOG_FILE = 'kmz_processor.log'
```

## How It Works

1. **File Discovery**: Scans the specified folder for `.kmz` files
2. **KMZ Extraction**: Extracts KML content from each KMZ file
3. **XML Parsing**: Parses KML XML to find Placemark elements with LineString geometries
4. **Coordinate Extraction**: Extracts coordinate pairs from LineString elements
5. **Google Encoding**: Converts coordinates to Google's encoded polyline format
6. **Database Storage**: Stores polyline data with metadata in MySQL
7. **Logging**: Records all operations and errors

## Supported KML Elements

- **LineString**: Basic polyline geometry
- **MultiGeometry**: Multiple LineString elements in one Placemark
- **Placemark**: Container for polyline data with name and description
- **Coordinates**: Longitude, latitude coordinate pairs

## Output Format

### Google Encoded Polyline

The script converts KML coordinates to Google's encoded polyline format, which is:
- Compact representation of coordinate data
- Compatible with Google Maps API
- Efficient for storage and transmission

### Start and End Coordinates

Each polyline now includes:
- **Start coordinates**: First point of the polyline (start_lat, start_lng)
- **End coordinates**: Last point of the polyline (end_lat, end_lng)

These coordinates are useful for:
- Quick identification of polyline endpoints
- Spatial queries and filtering
- Distance calculations from reference points
- Route planning and analysis
- Performance optimization with database indexes

### Database Records

Each polyline is stored with:
- Source KMZ filename
- Polyline name and description
- Google encoded polyline string
- Coordinate count and bounding box
- Start and end coordinates (lat/lng)
- Creation timestamp

## Error Handling

The script handles various error conditions:
- Invalid KMZ files
- Missing KML content
- Database connection issues
- Coordinate parsing errors
- File access problems

## Logging

Logs are written to:
- Console output
- `kmz_processor.log` file

Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL

## Performance Considerations

- **Coordinate Limits**: Default limit of 10,000 coordinates per polyline
- **Batch Processing**: Processes files sequentially to manage memory
- **Database Indexes**: Creates indexes for better query performance
  - `idx_filename`: For filtering by source KMZ file
  - `idx_created_at`: For time-based queries
  - `idx_start_coords`: For spatial queries on starting points
  - `idx_end_coords`: For spatial queries on ending points
- **Connection Management**: Properly closes database connections

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MySQL server is running
   - Check database credentials
   - Ensure database exists

2. **No KMZ Files Found**
   - Update `KMZ_FOLDER_PATH` in config.py
   - Verify folder contains `.kmz` files

3. **Permission Errors**
   - Check file/folder permissions
   - Run with appropriate user privileges

4. **Memory Issues**
   - Reduce `MAX_COORDINATES_PER_POLYLINE` in config
   - Process files in smaller batches

### Debug Mode

Set `LOG_LEVEL = 'DEBUG'` in `config.py` for detailed logging.

## Example Output

```
KMZ Polyline Processor
==================================================
Database: TRANSMISSION1 on localhost
KMZ Folder: C:\data\kmz_files
Max coordinates per polyline: 10000
==================================================
2024-01-15 10:30:00 - INFO - Successfully connected to MySQL database
2024-01-15 10:30:01 - INFO - Found 3 KMZ files
2024-01-15 10:30:01 - INFO - Processing KMZ file: route1.kmz
2024-01-15 10:30:02 - INFO - Extracted 2 polylines from KML
2024-01-15 10:30:02 - INFO - Stored polyline 'Main Route' from route1.kmz
2024-01-15 10:30:02 - INFO - Stored polyline 'Secondary Route' from route1.kmz

Processing Results:
==================================================
route1.kmz: 2 polylines
route2.kmz: 1 polylines
route3.kmz: 3 polylines

Total polylines processed: 6
Results saved to table: polylines
```

## API Integration

The stored Google encoded polylines can be used with:

- Google Maps JavaScript API
- Google Maps Android/iOS SDKs
- Other mapping libraries that support encoded polylines

## Contributing

To extend the functionality:

1. Add new KML element support in `parse_kml_polylines()`
2. Implement additional coordinate formats
3. Add support for other geometry types
4. Enhance error handling and validation

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions:
1. Check the log files for error details
2. Verify configuration settings
3. Test with a simple KMZ file first
4. Ensure all dependencies are installed
