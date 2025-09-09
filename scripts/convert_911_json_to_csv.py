import json
import csv
from datetime import datetime

def convert_json_to_csv(json_file_path, csv_file_path):
    """Convert Wharton Smith 911 JSON data to CSV format"""
    
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    print(f"JSON loaded successfully!")
    print(f"Available keys: {list(data.keys())}")
    
    # Get location mapping
    location_mapping = data.get('locationKeyToName', {})
    print(f"Total locations: {len(location_mapping)}")
    
    # Get table data (dates -> locations -> trades)
    table_data = data.get('table', {})
    dates = sorted(table_data.keys())
    print(f"Date range: {dates[0]} to {dates[-1]} ({len(dates)} dates)")
    
    # Get all trades
    all_trades = set()
    for date in dates:
        for location_id in table_data[date]:
            if isinstance(table_data[date][location_id], dict):
                all_trades.update(table_data[date][location_id].keys())
    
    all_trades = sorted(list(all_trades))
    print(f"All trades found: {all_trades}")
    
    # Prepare CSV data
    csv_rows = []
    csv_headers = ['location', 'section', 'level / floor', 'trade', 'state', 'start_date', 'complete_date', 'capture_date']
    
    for date in dates:
        for location_id, trade_data in table_data[date].items():
            if isinstance(trade_data, dict):
                # Get location name
                location_name = location_mapping.get(location_id, location_id)
                
                # Extract section from location name (e.g., "Zone 1-USS 2" -> "Zone 1")
                section = ""
                if "-" in location_name:
                    section = location_name.split("-")[0].strip()
                
                # Extract level/floor (placeholder for now)
                level_floor = ""
                
                for trade, state in trade_data.items():
                    csv_rows.append([
                        location_name,      # location
                        section,            # section  
                        level_floor,        # level / floor
                        trade,              # trade
                        state,              # state
                        "",                 # start_date (will be derived later)
                        "",                 # complete_date (will be derived later)
                        date                # capture_date
                    ])
    
    # Write to CSV
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(csv_headers)
        writer.writerows(csv_rows)
    
    print(f"✅ CSV created: {csv_file_path}")
    print(f"Total rows: {len(csv_rows)} (plus header)")
    print(f"Sample row: {csv_rows[0] if csv_rows else 'No data'}")
    
    return csv_rows

if __name__ == "__main__":
    convert_json_to_csv("wharton_platform/911_clean_fixed.json", "wharton_platform/WhartonSmith_911_raw.csv")
