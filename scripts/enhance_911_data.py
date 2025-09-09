import csv
from collections import defaultdict

def enhance_911_data(input_csv, output_csv):
    """Enhance Wharton Smith 911 CSV data with derived dates and sections"""
    
    # Read CSV
    rows = []
    with open(input_csv, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        headers = reader.fieldnames
        rows = list(reader)
    
    print(f"Loaded {len(rows)} rows")
    print(f"Columns: {headers}")
    
    # Sort by location, trade, and capture_date for processing
    rows.sort(key=lambda x: (x['location'], x['trade'], x['capture_date']))
    
    # Track state transitions for each location-trade combination
    transitions = defaultdict(list)
    
    for row in rows:
        key = f"{row['location']}_{row['trade']}"
        transitions[key].append({
            'date': row['capture_date'], 
            'state': row['state']
        })
    
    # Derive start and complete dates
    start_dates = {}
    complete_dates = {}
    
    for key, history in transitions.items():
        # Sort by date
        history.sort(key=lambda x: x['date'])
        
        # Find start date: first transition from "not started" to "in progress"
        start_date = ""
        for i in range(len(history) - 1):
            current_state = history[i]['state']
            next_state = history[i + 1]['state']
            if current_state == "not started" and next_state == "in progress":
                start_date = history[i + 1]['date']
                break
        
        # Find complete date: first transition to "complete"
        complete_date = ""
        for transition in history:
            if transition['state'] == "complete":
                complete_date = transition['date']
                break
        
        start_dates[key] = start_date
        complete_dates[key] = complete_date
    
    # Process each row
    enhanced_rows = []
    for row in rows:
        key = f"{row['location']}_{row['trade']}"
        
        # Apply derived dates
        row['start_date'] = start_dates.get(key, "")
        row['complete_date'] = complete_dates.get(key, "")
        
        # Extract section from location
        location = row['location']
        section = ""
        if location and "-" in location:
            parts = location.upper().split("-")
            if len(parts) >= 1:
                first_part = parts[0].strip()
                # Check if it looks like a zone/section pattern
                if "ZONE" in first_part or "LEVEL" in first_part or "FLOOR" in first_part:
                    section = first_part
        row['section'] = section
        
        # Fix data integrity
        state = row['state']
        if state == "not started":
            row['start_date'] = ""
            row['complete_date'] = ""
        elif state == "in progress":
            row['complete_date'] = ""  # Clear complete date for in-progress
        
        enhanced_rows.append(row)
    
    # Save enhanced CSV
    with open(output_csv, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(enhanced_rows)
    
    print(f"✅ Enhanced CSV saved: {output_csv}")
    print(f"Sample data:")
    for i, row in enumerate(enhanced_rows[:3]):
        print(f"Row {i+1}: {row}")
    
    # Summary stats
    unique_tasks = set()
    completed_tasks = set()
    in_progress_tasks = set()
    
    for row in enhanced_rows:
        task_key = f"{row['location']}_{row['trade']}"
        unique_tasks.add(task_key)
        
        if row['state'] == 'complete':
            completed_tasks.add(task_key)
        elif row['state'] == 'in progress':
            in_progress_tasks.add(task_key)
    
    total_tasks = len(unique_tasks)
    completed_count = len(completed_tasks)
    in_progress_count = len(in_progress_tasks)
    
    print(f"\n📊 SUMMARY:")
    print(f"Total unique tasks: {total_tasks}")
    print(f"Completed tasks: {completed_count}")
    print(f"In progress tasks: {in_progress_count}")
    print(f"Completion rate: {(completed_count/total_tasks*100):.1f}%")
    
    return enhanced_rows

if __name__ == "__main__":
    enhance_911_data("wharton_platform/WhartonSmith_911_raw.csv", "wharton_platform/WhartonSmith_911_enhanced.csv")
