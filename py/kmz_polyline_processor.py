#!/usr/bin/env python3
"""
KMZ Polyline Processor
Reads KMZ files, extracts polylines, converts to Google encoded format, and stores in MySQL database.
"""

import os
import zipfile
import xml.etree.ElementTree as ET
import mysql.connector
from mysql.connector import Error
import re
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('kmz_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class KMZPolylineProcessor:
    def __init__(self, db_config: Dict[str, str], kmz_folder: str):
        """
        Initialize the KMZ Polyline Processor
        
        Args:
            db_config: MySQL database configuration dictionary
            kmz_folder: Path to folder containing KMZ files
        """
        self.db_config = db_config
        self.kmz_folder = kmz_folder
        self.connection = None
        
    def connect_to_database(self) -> bool:
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            if self.connection.is_connected():
                logger.info("Successfully connected to MySQL database")
                return True
        except Error as e:
            logger.error(f"Error connecting to MySQL database: {e}")
            return False
        return False
    
    def create_table_if_not_exists(self):
        """Create the polylines table if it doesn't exist"""
        try:
            cursor = self.connection.cursor()
            
            create_table_query = """
            CREATE TABLE IF NOT EXISTS polylines (
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
            """
            
            cursor.execute(create_table_query)
            self.connection.commit()
            logger.info("Polylines table created/verified successfully")
            
        except Error as e:
            logger.error(f"Error creating table: {e}")
        finally:
            if cursor:
                cursor.close()
    
    def extract_kmz_files(self) -> List[str]:
        """Get list of all KMZ files in the specified folder"""
        kmz_files = []
        try:
            for file in os.listdir(self.kmz_folder):
                if file.lower().endswith('.kmz'):
                    kmz_files.append(os.path.join(self.kmz_folder, file))
            logger.info(f"Found {len(kmz_files)} KMZ files")
            return kmz_files
        except Exception as e:
            logger.error(f"Error listing KMZ files: {e}")
            return []
    
    def extract_kml_from_kmz(self, kmz_path: str) -> Optional[str]:
        """Extract KML content from KMZ file"""
        try:
            with zipfile.ZipFile(kmz_path, 'r') as kmz_file:
                # Look for doc.kml file in the KMZ
                kml_files = [f for f in kmz_file.namelist() if f.endswith('.kml')]
                
                if not kml_files:
                    logger.warning(f"No KML file found in {kmz_path}")
                    return None
                
                # Read the first KML file (usually doc.kml)
                kml_content = kmz_file.read(kml_files[0]).decode('utf-8')
                return kml_content
                
        except Exception as e:
            logger.error(f"Error extracting KML from {kmz_path}: {e}")
            return None
    
    def parse_kml_polylines(self, kml_content: str) -> List[Dict]:
        """Parse KML content and extract polyline information"""
        polylines = []
        
        try:
            # Parse XML content
            root = ET.fromstring(kml_content)
            
            # Define namespace for KML
            namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
            
            # Find all Placemark elements
            placemarks = root.findall('.//kml:Placemark', namespace)
            
            for placemark in placemarks:
                polyline_data = {}
                
                # Extract name
                name_elem = placemark.find('kml:name', namespace)
                if name_elem is not None:
                    polyline_data['name'] = name_elem.text
                
                # Extract description
                desc_elem = placemark.find('kml:description', namespace)
                if desc_elem is not None:
                    polyline_data['description'] = desc_elem.text
                
                # Look for LineString or MultiGeometry with LineString
                line_string = placemark.find('.//kml:LineString', namespace)
                
                if line_string is not None:
                    # Extract coordinates
                    coords_elem = line_string.find('kml:coordinates', namespace)
                    if coords_elem is not None and coords_elem.text:
                        coordinates = self.parse_coordinates(coords_elem.text)
                        if coordinates:
                            polyline_data['coordinates'] = coordinates
                            polyline_data['coordinates_count'] = len(coordinates)
                            polyline_data['bounding_box'] = self.calculate_bounding_box(coordinates)
                            polylines.append(polyline_data)
                
                # Check for MultiGeometry
                multi_geom = placemark.find('.//kml:MultiGeometry', namespace)
                if multi_geom is not None:
                    line_strings = multi_geom.findall('.//kml:LineString', namespace)
                    for i, ls in enumerate(line_strings):
                        coords_elem = ls.find('kml:coordinates', namespace)
                        if coords_elem is not None and coords_elem.text:
                            coordinates = self.parse_coordinates(coords_elem.text)
                            if coordinates:
                                polyline_data_copy = polyline_data.copy()
                                polyline_data_copy['coordinates'] = coordinates
                                polyline_data_copy['coordinates_count'] = len(coordinates)
                                polyline_data_copy['bounding_box'] = self.calculate_bounding_box(coordinates)
                                if len(line_strings) > 1:
                                    polyline_data_copy['name'] = f"{polyline_data.get('name', 'Polyline')}_{i+1}"
                                polylines.append(polyline_data_copy)
            
            logger.info(f"Extracted {len(polylines)} polylines from KML")
            return polylines
            
        except Exception as e:
            logger.error(f"Error parsing KML content: {e}")
            return []
    
    def parse_coordinates(self, coords_text: str) -> List[Tuple[float, float]]:
        """Parse coordinate string from KML and return list of (lon, lat) tuples"""
        coordinates = []
        try:
            # Split by whitespace and newlines
            coord_pairs = re.split(r'[\s\n]+', coords_text.strip())
            
            for pair in coord_pairs:
                if pair:
                    # Split by comma (KML format: lon,lat,altitude)
                    parts = pair.split(',')
                    if len(parts) >= 2:
                        lon = float(parts[0])
                        lat = float(parts[1])
                        coordinates.append((lon, lat))
            
            return coordinates
            
        except Exception as e:
            logger.error(f"Error parsing coordinates: {e}")
            return []
    
    def calculate_bounding_box(self, coordinates: List[Tuple[float, float]]) -> str:
        """Calculate bounding box from coordinates"""
        if not coordinates:
            return ""
        
        lons = [coord[0] for coord in coordinates]
        lats = [coord[1] for coord in coordinates]
        
        min_lon, max_lon = min(lons), max(lons)
        min_lat, max_lat = min(lats), max(lats)
        
        return f"{min_lon:.6f},{min_lat:.6f},{max_lon:.6f},{max_lat:.6f}"
    
    def encode_polyline(self, coordinates: List[Tuple[float, float]]) -> str:
        """Convert coordinates to Google encoded polyline format"""
        if not coordinates:
            return ""
        
        def encode_number(num):
            """Encode a single number"""
            num = int(round(num * 1e5))
            num = num << 1
            if num < 0:
                num = ~num
            result = ""
            while num >= 0x20:
                result += chr((0x20 | (num & 0x1f)) + 63)
                num >>= 5
            result += chr(num + 63)
            return result
        
        encoded = ""
        prev_lat = 0
        prev_lon = 0
        
        for lat, lon in coordinates:
            # Encode latitude
            dlat = lat - prev_lat
            encoded += encode_number(dlat)
            prev_lat = lat
            
            # Encode longitude
            dlon = lon - prev_lon
            encoded += encode_number(dlon)
            prev_lon = lon
        
        return encoded
    
    def store_polyline_in_database(self, kmz_filename: str, polyline_data: Dict) -> bool:
        """Store polyline data in MySQL database"""
        try:
            cursor = self.connection.cursor()
            
            # Convert coordinates to Google encoded polyline
            google_encoded = self.encode_polyline(polyline_data['coordinates'])
            
            # Calculate start and end coordinates
            start_lat = polyline_data['coordinates'][0][1]
            start_lng = polyline_data['coordinates'][0][0]
            end_lat = polyline_data['coordinates'][-1][1]
            end_lng = polyline_data['coordinates'][-1][0]
            
            insert_query = """
            INSERT INTO polylines (
                kmz_filename, polyline_name, polyline_description, 
                google_encoded_polyline, coordinates_count, bounding_box,
                start_lat, start_lng, end_lat, end_lng
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                os.path.basename(kmz_filename),
                polyline_data.get('name', ''),
                polyline_data.get('description', ''),
                google_encoded,
                polyline_data.get('coordinates_count', 0),
                polyline_data.get('bounding_box', ''),
                start_lat,
                start_lng,
                end_lat,
                end_lng
            )
            
            cursor.execute(insert_query, values)
            self.connection.commit()
            
            logger.info(f"Stored polyline '{polyline_data.get('name', 'Unnamed')}' from {os.path.basename(kmz_filename)}")
            return True
            
        except Error as e:
            logger.error(f"Error storing polyline in database: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
    
    def process_kmz_file(self, kmz_path: str) -> int:
        """Process a single KMZ file and return number of polylines processed"""
        logger.info(f"Processing KMZ file: {os.path.basename(kmz_path)}")
        
        # Extract KML content
        kml_content = self.extract_kml_from_kmz(kmz_path)
        if not kml_content:
            return 0
        
        # Parse polylines
        polylines = self.parse_kml_polylines(kml_content)
        if not polylines:
            return 0
        
        # Store each polyline in database
        processed_count = 0
        for polyline in polylines:
            if self.store_polyline_in_database(kmz_path, polyline):
                processed_count += 1
        
        logger.info(f"Successfully processed {processed_count} polylines from {os.path.basename(kmz_path)}")
        return processed_count
    
    def process_all_kmz_files(self) -> Dict[str, int]:
        """Process all KMZ files in the folder"""
        if not self.connect_to_database():
            return {}
        
        try:
            # Create table if it doesn't exist
            self.create_table_if_not_exists()
            
            # Get list of KMZ files
            kmz_files = self.extract_kmz_files()
            if not kmz_files:
                logger.warning("No KMZ files found to process")
                return {}
            
            # Process each KMZ file
            results = {}
            total_polylines = 0
            
            for kmz_file in kmz_files:
                processed_count = self.process_kmz_file(kmz_file)
                results[os.path.basename(kmz_file)] = processed_count
                total_polylines += processed_count
            
            logger.info(f"Processing complete. Total polylines processed: {total_polylines}")
            return results
            
        except Exception as e:
            logger.error(f"Error during processing: {e}")
            return {}
        finally:
            if self.connection and self.connection.is_connected():
                self.connection.close()
                logger.info("Database connection closed")

def main():
    """Main function to run the KMZ processor"""
    
    # Database configuration
    db_config = {
        'host': 'localhost',
        'database': 'TRANSMISSION1',
        'user': 'uktx',
        'password': 'uktx123',
        'charset': 'utf8mb4'
    }
    
    # KMZ folder path (change this to your KMZ files folder)
    kmz_folder = r"C:\path\to\your\kmz\files"  # Update this path
    
    # Check if folder exists
    if not os.path.exists(kmz_folder):
        logger.error(f"KMZ folder does not exist: {kmz_folder}")
        print(f"Please update the 'kmz_folder' path in the script to point to your KMZ files folder.")
        return
    
    # Create processor instance
    processor = KMZPolylineProcessor(db_config, kmz_folder)
    
    # Process all KMZ files
    results = processor.process_all_kmz_files()
    
    # Display results
    if results:
        print("\nProcessing Results:")
        print("=" * 50)
        for filename, count in results.items():
            print(f"{filename}: {count} polylines")
        
        total = sum(results.values())
        print(f"\nTotal polylines processed: {total}")
    else:
        print("No polylines were processed.")

if __name__ == "__main__":
    main()
