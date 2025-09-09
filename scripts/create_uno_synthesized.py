#!/usr/bin/env python3
import csv
import datetime
from collections import defaultdict

def create_uno_synthesized():
    # Read the original UNO data
    input_file = 'UNO_construction_data_fixed.csv'
    output_file = 'UNO_synthesized.csv'
    
    # Create mapping for generic location names
    # Group locations by their section/zone
    section_locations = defaultdict(list)
    
    # First pass: collect all unique locations per section
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            section = row['section']
            location = row['location']
            if location not in section_locations[section]:
                section_locations[section].append(location)
    
    # Create generic location mapping
    location_mapping = {}
    for section, locations in section_locations.items():
        for i, location in enumerate(locations, 1):
            if section.startswith('Zone'):
                # For zones, use "Zone X, Location Y" format
                generic_name = f"{section}, Location {i}"
            else:
                # For other sections, use "Section X, Location Y" format
                generic_name = f"{section}, Location {i}"
            location_mapping[location] = generic_name
    
    # Process the data with generic names and shifted dates
    rows = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Create new row with generic location name
            new_row = row.copy()
            new_row['location'] = location_mapping.get(row['location'], row['location'])
            
            # Shift dates by 6 months earlier
            for date_field in ['start_date', 'complete_date', 'capture_date']:
                if row[date_field] and row[date_field] != '':
                    try:
                        # Parse the date (format: YYYY/MM/DD)
                        original_date = datetime.datetime.strptime(row[date_field], '%Y/%m/%d')
                        # Shift 6 months earlier
                        shifted_date = original_date.replace(year=original_date.year - 1, month=max(1, original_date.month - 6))
                        # Adjust year if month goes below 1
                        if original_date.month <= 6:
                            shifted_date = shifted_date.replace(year=shifted_date.year - 1, month=shifted_date.month + 6)
                        new_row[date_field] = shifted_date.strftime('%Y/%m/%d')
                    except ValueError:
                        # Keep original if date parsing fails
                        pass
            
            rows.append(new_row)
    
    # Write the synthesized data
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if rows:
            fieldnames = rows[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    print(f"✅ Created {output_file} with {len(rows)} rows")
    print(f"📊 Original locations mapped to generic names:")
    for original, generic in list(location_mapping.items())[:10]:  # Show first 10
        print(f"   {original} → {generic}")
    if len(location_mapping) > 10:
        print(f"   ... and {len(location_mapping) - 10} more locations")
    
    # Show date range info
    capture_dates = [row['capture_date'] for row in rows if row['capture_date']]
    if capture_dates:
        min_date = min(capture_dates)
        max_date = max(capture_dates)
        print(f"📅 Date range: {min_date} to {max_date}")

if __name__ == "__main__":
    create_uno_synthesized()
