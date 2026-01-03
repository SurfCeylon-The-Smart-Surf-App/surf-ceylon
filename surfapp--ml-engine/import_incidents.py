import pandas as pd
import pymongo
from datetime import datetime
import re
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
client = pymongo.MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['surf-risk-analyzer']
incidents_collection = db['incidents']
surf_spots_collection = db['surfspots']

def parse_date(date_str):
    """Parse various date formats from the CSV"""
    if pd.isna(date_str) or date_str == 'Ongoing' or 'Ongoing' in str(date_str):
        return None
    
    try:
        # Try various date formats
        for fmt in ['%d-%b', '%b-%y', '%d-%b-%y', '%b-%d', '%Y-%m-%d']:
            try:
                return datetime.strptime(str(date_str).strip(), fmt)
            except:
                continue
        
        # Extract year and month from complex strings
        if 'to' in str(date_str):
            parts = str(date_str).split('to')
            date_str = parts[0].strip()
        
        # Handle month-year format
        match = re.search(r'([A-Za-z]+)[\s-](\d{2,4})', str(date_str))
        if match:
            month_str, year_str = match.groups()
            year = int(year_str) if len(year_str) == 4 else 2000 + int(year_str)
            return datetime.strptime(f"{month_str}-{year}", '%b-%Y')
            
    except Exception as e:
        print(f"Could not parse date: {date_str} - {e}")
    
    return datetime.now()  # Default to current date

def categorize_severity(incident_type):
    """Categorize incident severity based on type"""
    fatal_keywords = ['drowning', 'drowned', 'fatal', 'death', 'died']
    severe_keywords = ['fracture', 'broken', 'severe', 'hospital', 'emergency']
    moderate_keywords = ['injury', 'laceration', 'strain', 'sprain', 'cut', 'contusion']
    
    incident_lower = incident_type.lower()
    
    if any(keyword in incident_lower for keyword in fatal_keywords):
        return 'fatal'
    elif any(keyword in incident_lower for keyword in severe_keywords):
        return 'severe'
    elif any(keyword in incident_lower for keyword in moderate_keywords):
        return 'moderate'
    else:
        return 'minor'

def get_season(month):
    """Determine season based on month"""
    if month in [12, 1, 2]:
        return 'Northeast Monsoon'
    elif month in [3, 4, 5]:
        return 'Inter-Monsoon (Spring)'
    elif month in [6, 7, 8, 9]:
        return 'Southwest Monsoon'
    else:
        return 'Inter-Monsoon (Fall)'

def import_incidents():
    """Import incidents from CSV to MongoDB"""
    print("Loading incidents data...")
    df = pd.read_csv('data/Surfing_incidents.csv')
    
    print(f"Found {len(df)} incidents in CSV")
    
    # Clear existing incidents
    incidents_collection.delete_many({})
    print("Cleared existing incidents")
    
    imported_count = 0
    
    for idx, row in df.iterrows():
        try:
            incident_date = parse_date(row['Date'])
            
            incident_doc = {
                'date': incident_date,
                'location': str(row['Location']).strip(),
                'site': str(row['Site']).strip(),
                'incidentType': str(row['Incident Type']).strip(),
                'victimDetails': str(row['Victim Details']) if pd.notna(row['Victim Details']) else '',
                'circumstances': str(row['Circumstances']) if pd.notna(row['Circumstances']) else '',
                'source': str(row['Source']) if pd.notna(row['Source']) else '',
                'severity': categorize_severity(str(row['Incident Type'])),
                'month': incident_date.month if incident_date else None,
                'year': incident_date.year if incident_date else None,
                'season': get_season(incident_date.month) if incident_date else None
            }
            
            incidents_collection.insert_one(incident_doc)
            imported_count += 1
            
        except Exception as e:
            print(f"Error importing row {idx}: {e}")
            continue
    
    print(f"Successfully imported {imported_count} incidents")
    
    # Create indexes
    incidents_collection.create_index([('site', 1), ('date', -1)])
    print("Created indexes on incidents collection")

def initialize_surf_spots():
    """Initialize surf spots with coordinates"""
    print("Initializing surf spots...")
    
    surf_spots_data = [
        {'name': 'Arugam Bay', 'location': 'Eastern Province', 'coordinates': {'latitude': 6.8403, 'longitude': 81.8358}},
        {'name': 'Hikkaduwa', 'location': 'Southern Province', 'coordinates': {'latitude': 6.1389, 'longitude': 80.1039}},
        {'name': 'Weligama', 'location': 'Southern Province', 'coordinates': {'latitude': 5.9750, 'longitude': 80.4296}},
        {'name': 'Unawatuna', 'location': 'Southern Province', 'coordinates': {'latitude': 6.0108, 'longitude': 80.2506}},
        {'name': 'Midigama', 'location': 'Southern Province', 'coordinates': {'latitude': 5.9622, 'longitude': 80.3722}},
        {'name': 'Mirissa', 'location': 'Southern Province', 'coordinates': {'latitude': 5.9466, 'longitude': 80.4698}},
        {'name': 'Matara', 'location': 'Southern Province', 'coordinates': {'latitude': 5.9485, 'longitude': 80.5353}},
        {'name': 'Ahangama', 'location': 'Southern Province', 'coordinates': {'latitude': 5.9722, 'longitude': 80.3681}},
        {'name': 'Thalpe', 'location': 'Southern Province', 'coordinates': {'latitude': 6.0239, 'longitude': 80.2369}},
        {'name': 'Trincomalee', 'location': 'Eastern Province', 'coordinates': {'latitude': 8.5874, 'longitude': 81.2152}},
        {'name': 'Point Pedro', 'location': 'Northern Province', 'coordinates': {'latitude': 9.8167, 'longitude': 80.2333}},
        {'name': 'Kalpitiya', 'location': 'North Western Province', 'coordinates': {'latitude': 8.2333, 'longitude': 79.7667}}
    ]
    
    # Clear existing surf spots
    surf_spots_collection.delete_many({})
    
    for spot_data in surf_spots_data:
        # Count incidents for this spot
        incident_count = incidents_collection.count_documents({'site': spot_data['name']})
        
        spot_data['totalIncidents'] = incident_count
        spot_data['riskScore'] = 0
        spot_data['riskLevel'] = 'Low'
        spot_data['flagColor'] = 'green'
        spot_data['lastUpdated'] = datetime.now()
        spot_data['recentHazards'] = []
        
        surf_spots_collection.insert_one(spot_data)
    
    print(f"Initialized {len(surf_spots_data)} surf spots")

if __name__ == '__main__':
    print("Starting data import...")
    import_incidents()
    initialize_surf_spots()
    print("Data import completed successfully!")
    client.close()