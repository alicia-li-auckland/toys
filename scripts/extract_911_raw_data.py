import json

def extract_raw_data_to_txt(json_file, output_txt):
    """Extract raw data from 911 JSON and convert to simple text format"""
    
    with open(json_file, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    print("Extracting raw data from JSON...")
    
    # Get location mapping
    location_mapping = data.get('locationKeyToName', {})
    
    # Get table data
    table_data = data.get('table', {})
    
    # Extract all raw entries
    raw_entries = []
    
    for date, locations in table_data.items():
        for location_id, trades in locations.items():
            if isinstance(trades, dict):
                # Get actual location name
                location_name = location_mapping.get(location_id, location_id)
                
                for trade, status in trades.items():
                    raw_entries.append({
                        'date': date,
                        'location': location_name,
                        'trade': trade,
                        'status': status
                    })
    
    # Sort by date, then location, then trade
    raw_entries.sort(key=lambda x: (x['date'], x['location'], x['trade']))
    
    # Write to text file
    with open(output_txt, 'w', encoding='utf-8') as file:
        file.write("WHARTON SMITH 911 PROJECT - RAW DATA EXPORT\n")
        file.write("=" * 50 + "\n\n")
        file.write("Format: DATE | LOCATION | TRADE | STATUS\n")
        file.write("-" * 50 + "\n\n")
        
        for entry in raw_entries:
            line = f"{entry['date']} | {entry['location']} | {entry['trade']} | {entry['status']}\n"
            file.write(line)
    
    print(f"✅ Raw data exported to: {output_txt}")
    print(f"Total entries: {len(raw_entries)}")
    print(f"Date range: {min(e['date'] for e in raw_entries)} to {max(e['date'] for e in raw_entries)}")
    print(f"Unique locations: {len(set(e['location'] for e in raw_entries))}")
    print(f"Unique trades: {len(set(e['trade'] for e in raw_entries))}")
    
    # Show sample data
    print(f"\nSample entries:")
    for i, entry in enumerate(raw_entries[:5]):
        print(f"{i+1}. {entry['date']} | {entry['location']} | {entry['trade']} | {entry['status']}")
    
    return raw_entries

if __name__ == "__main__":
    extract_raw_data_to_txt("wharton_platform/911_clean_fixed.json", "WhartonSmith_911_Raw_Data.txt")
