import re
import json

def convert_rtf_to_json(rtf_file_path, output_file_path):
    """Convert RTF formatted JSON file to clean JSON"""
    
    with open(rtf_file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    print(f"Original file size: {len(content)} characters")
    
    # Remove RTF header and formatting
    # Find the actual JSON content by looking for the "table" key
    table_start = content.find('"table":')
    if table_start == -1:
        raise ValueError("No 'table' key found in RTF file")
    
    # Work backwards to find the opening brace before "table"
    json_start = content.rfind('\\{', 0, table_start)
    if json_start == -1:
        json_start = content.rfind('{', 0, table_start)
    
    if json_start == -1:
        raise ValueError("No opening brace found before 'table' key")
    
    # Extract content from that point to end
    json_content = content[json_start:]
    
    # Step 1: Convert RTF escaped braces to actual braces
    json_content = json_content.replace('\\{', '{')
    json_content = json_content.replace('\\}', '}')
    json_content = json_content.replace('\\"', '"')
    
    # Step 2: Remove all RTF control sequences aggressively
    json_content = re.sub(r'\\[a-zA-Z]+\d*\*?\s*', '', json_content)  # Remove RTF commands
    json_content = re.sub(r'\\[^a-zA-Z\s]', '', json_content)         # Remove escape sequences
    
    # Step 3: Remove RTF formatting groups that aren't JSON
    json_content = re.sub(r'{[^{}"]*;[^}]*}', '', json_content)  # Remove {font;color;} groups
    json_content = re.sub(r'{\\[^}]*}', '', json_content)        # Remove {\command} groups
    
    # Step 4: Clean up remaining artifacts
    json_content = re.sub(r'\\+', '', json_content)    # Remove backslashes
    json_content = re.sub(r'\s+', ' ', json_content)   # Normalize whitespace
    json_content = json_content.strip()
    
    # Step 5: Ensure proper JSON structure
    if not json_content.startswith('{'):
        json_content = '{' + json_content
    if not json_content.endswith('}'):
        json_content = json_content + '}'
    
    # Step 5: Final cleanup
    json_content = re.sub(r'\s+', ' ', json_content)
    json_content = json_content.strip()
    
    print(f"Cleaned content size: {len(json_content)} characters")
    print(f"First 200 chars: {json_content[:200]}")
    
    try:
        # Parse the JSON
        data = json.loads(json_content)
        
        # Write clean JSON to output file
        with open(output_file_path, 'w', encoding='utf-8') as outfile:
            json.dump(data, outfile, indent=2)
        
        print(f"✅ Successfully converted {rtf_file_path} to {output_file_path}")
        print(f"JSON contains {len(data)} top-level keys")
        
        if 'table' in data:
            dates = list(data['table'].keys())
            print(f"Date range: {min(dates)} to {max(dates)}")
            print(f"Total dates: {len(dates)}")
            
        if 'locationKeyToName' in data:
            print(f"Total locations: {len(data['locationKeyToName'])}")
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Content around error: {json_content[max(0, e.pos-50):e.pos+50]}")
        return None

if __name__ == "__main__":
    convert_rtf_to_json("wharton_platform/911_raw.rtf", "wharton_platform/911_clean.json")
