import csv

def convert_raw_txt_to_csv(txt_file, csv_file):
    """Convert the raw data TXT file to CSV format"""
    
    # Read the text file
    with open(txt_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    print(f"Reading {len(lines)} lines from {txt_file}")
    
    # Filter out header lines and empty lines
    data_lines = []
    for line in lines:
        line = line.strip()
        if '|' in line and not line.startswith('Format:') and not line.startswith('=') and not line.startswith('-'):
            data_lines.append(line)
    
    print(f"Found {len(data_lines)} data lines")
    
    # Parse each line into CSV format
    csv_rows = []
    headers = ['date', 'location', 'trade', 'status']
    
    for line in data_lines:
        # Split by ' | ' (pipe with spaces)
        parts = [part.strip() for part in line.split(' | ')]
        
        if len(parts) == 4:
            date, location, trade, status = parts
            csv_rows.append([date, location, trade, status])
        else:
            print(f"Warning: Skipping malformed line: {line}")
    
    # Write to CSV
    with open(csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)  # Write header row
        writer.writerows(csv_rows)
    
    print(f"✅ CSV created: {csv_file}")
    print(f"Total rows: {len(csv_rows)} (plus header)")
    print(f"Columns: {headers}")
    
    # Show sample data
    print(f"\nSample CSV rows:")
    for i, row in enumerate(csv_rows[:5]):
        print(f"{i+1}. {row}")
    
    # Summary statistics
    dates = set(row[0] for row in csv_rows)
    locations = set(row[1] for row in csv_rows)
    trades = set(row[2] for row in csv_rows)
    statuses = set(row[3] for row in csv_rows)
    
    print(f"\n📊 Summary:")
    print(f"Unique dates: {len(dates)}")
    print(f"Unique locations: {len(locations)}")
    print(f"Unique trades: {len(trades)}")
    print(f"Unique statuses: {len(statuses)}")
    print(f"Trades: {sorted(trades)}")
    print(f"Statuses: {sorted(statuses)}")
    
    return csv_rows

if __name__ == "__main__":
    convert_raw_txt_to_csv("WhartonSmith_911_Raw_Data.txt", "WhartonSmith_911_Raw_Data.csv")
