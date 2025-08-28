#!/usr/bin/env python3
"""
KMZ Polyline Processor (Configuration-based)
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
import sys

# Import configuration
try:
    from config import *
except ImportError:
    print("Error: config.py file not found. Please create it first.")
    sys.exit(1)

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
        
        # Configure logging
        logging.basicConfig(
            level=getattr(logging, LOG_LEVEL),
            format=LOG_FORMAT,
            handlers=[
                logging.FileHandler(LOG_FILE),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def connect_to_database(self) -> bool:
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            if self.connection.is_connected():
                self.logger.info("Successfully connected to MySQL database")
                return True
        except Error as e:
            self.logger.error(f"Error connecting to MySQL database: {e}")
            return False
        return False
    
    def create_table_if_not_exists(self):
        """Create the polylines table if it doesn't exist"""
        try:
            cursor = self.connection.cursor()
            
            create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
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
            ) ENGINE={TABLE_ENGINE} DEFAULT CHARSET={TABLE_CHARSET} COLLATE={TABLE_COLLATION}
            """
            
            cursor.execute(create_table_query)
            self.connection.commit()
            self.logger.info(f"Table '{TABLE_NAME}' created/verified successfully")
            
        except Error as e:
            self.logger.error(f"Error creating table: {e}")
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
            self.logger.info(f"Found {len(kmz_files)} KMZ files")
            return kmz_files
        except Exception as e:
            self.logger.error(f"Error listing KMZ files: {e}")
            return []
    
    def extract_kml_from_kmz(self, kmz_path: str) -> Optional[str]:
        """Extract KML content from KMZ file"""
        try:
            with zipfile.ZipFile(kmz_path, 'r') as kmz_file:
                # Look for doc.kml file in the KMZ
                kml_files = [f for f in kmz_file.namelist() if f.endswith('.kml')]
                
                if not kml_files:
                    self.logger.warning(f"No KML file found in {kmz_path}")
                    return None
                
                # Read the first KML file (usually doc.kml)
                kml_content = kmz_file.read(kml_files[0]).decode('utf-8')
                return kml_content
                
        except Exception as e:
            self.logger.error(f"Error extracting KML from {kmz_path}: {e}")
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
                        if coordinates and len(coordinates) <= MAX_COORDINATES_PER_POLYLINE:
                            polyline_data['coordinates'] = coordinates
                            polyline_data['coordinates_count'] = len(coordinates)
                            polyline_data['bounding_box'] = self.calculate_bounding_box(coordinates)
                            polylines.append(polyline_data)
                        elif len(coordinates) > MAX_COORDINATES_PER_POLYLINE:
                            self.logger.warning(f"Polyline '{polyline_data.get('name', 'Unnamed')}' has {len(coordinates)} coordinates, exceeding limit of {MAX_COORDINATES_PER_POLYLINE}")
                
                # Check for MultiGeometry
                multi_geom = placemark.find('.//kml:MultiGeometry', namespace)
                if multi_geom is not None:
                    line_strings = multi_geom.findall('.//kml:LineString', namespace)
                    for i, ls in enumerate(line_strings):
                        coords_elem = ls.find('kml:coordinates', namespace)
                        if coords_elem is not None and coords_elem.text:
                            coordinates = self.parse_coordinates(coords_elem.text)
                            if coordinates and len(coordinates) <= MAX_COORDINATES_PER_POLYLINE:
                                polyline_data_copy = polyline_data.copy()
                                polyline_data_copy['coordinates'] = coordinates
                                polyline_data_copy['coordinates_count'] = len(coordinates)
                                polyline_data_copy['bounding_box'] = self.calculate_bounding_box(coordinates)
                                if len(line_strings) > 1:
                                    polyline_data_copy['name'] = f"{polyline_data.get('name', 'Polyline')}_{i+1}"
                                polylines.append(polyline_data_copy)
                            elif len(coordinates) > MAX_COORDINATES_PER_POLYLINE:
                                self.logger.warning(f"MultiGeometry polyline '{polyline_data.get('name', 'Unnamed')}_{i+1}' has {len(coordinates)} coordinates, exceeding limit of {MAX_COORDINATES_PER_POLYLINE}")
            
            self.logger.info(f"Extracted {len(polylines)} polylines from KML")
            return polylines
            
        except Exception as e:
            self.logger.error(f"Error parsing KML content: {e}")
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
                        lat = float(parts[0])
                        lon = float(parts[1])
                        coordinates.append((lon, lat))
            
            return coordinates
            
        except Exception as e:
            self.logger.error(f"Error parsing coordinates: {e}")
            return []
    
    def calculate_bounding_box(self, coordinates: List[Tuple[float, float]]) -> str:
        """Calculate bounding box from coordinates"""
        if not coordinates:
            return ""
        
        lats = [coord[0] for coord in coordinates]
        lons = [coord[1] for coord in coordinates]
        
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
            start_lat = polyline_data['coordinates'][0][0]
            start_lng = polyline_data['coordinates'][0][1]
            end_lat = polyline_data['coordinates'][-1][0]
            end_lng = polyline_data['coordinates'][-1][1]
            
            insert_query = f"""
            INSERT INTO {TABLE_NAME} (
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
            
            self.logger.info(f"Stored polyline '{polyline_data.get('name', 'Unnamed')}' from {os.path.basename(kmz_filename)}")
            return True
            
        except Error as e:
            self.logger.error(f"Error storing polyline in database: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
    
    def process_kmz_file(self, kmz_path: str) -> int:
        """Process a single KMZ file and return number of polylines processed"""
        self.logger.info(f"Processing KMZ file: {os.path.basename(kmz_path)}")
        
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
        
        self.logger.info(f"Successfully processed {processed_count} polylines from {os.path.basename(kmz_path)}")
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
                self.logger.warning("No KMZ files found to process")
                return {}
            
            # Process each KMZ file
            results = {}
            total_polylines = 0
            
            for kmz_file in kmz_files:
                processed_count = self.process_kmz_file(kmz_file)
                results[os.path.basename(kmz_file)] = processed_count
                total_polylines += processed_count
            
            self.logger.info(f"Processing complete. Total polylines processed: {total_polylines}")
            return results
            
        except Exception as e:
            self.logger.error(f"Error during processing: {e}")
            return {}
        finally:
            if self.connection and self.connection.is_connected():
                self.connection.close()
                self.logger.info("Database connection closed")

def main():
    """Main function to run the KMZ processor"""
    
    # Check if KMZ folder exists
    if not os.path.exists(KMZ_FOLDER_PATH):
        print(f"Error: KMZ folder does not exist: {KMZ_FOLDER_PATH}")
        print(f"Please update the 'KMZ_FOLDER_PATH' in config.py to point to your KMZ files folder.")
        return
    
    print("KMZ Polyline Processor")
    print("=" * 50)
    print(f"Database: {DATABASE_CONFIG['database']} on {DATABASE_CONFIG['host']}")
    print(f"KMZ Folder: {KMZ_FOLDER_PATH}")
    print(f"Max coordinates per polyline: {MAX_COORDINATES_PER_POLYLINE}")
    print("=" * 50)
    
    # Create processor instance
    processor = KMZPolylineProcessor(DATABASE_CONFIG, KMZ_FOLDER_PATH)
    
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
        print(f"Results saved to table: {TABLE_NAME}")
    else:
        print("No polylines were processed.")

if __name__ == "__main__":
    main()
