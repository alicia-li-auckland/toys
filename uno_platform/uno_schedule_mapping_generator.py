#!/usr/bin/env python3
"""
UNO Schedule to Actualised Work Mapping Generator
Uses intelligent activity name parsing to create comprehensive mapping CSV
"""

import csv
from io import StringIO
from datetime import datetime
import re

class UNOActivityParser:
    """Intelligent parser for UNO construction activity names"""
    
    def __init__(self):
        # Location hierarchy mapping
        self.location_hierarchy = {
            'DCH1': {
                'type': 'Data Centre Hall Zone 1',
                'areas': [f'Area-{i}' for i in range(1, 9)],  # Areas 1-8
                'description': 'Left section of building'
            },
            'DCH2': {
                'type': 'Data Centre Hall Zone 2', 
                'areas': [f'Area-{i}' for i in range(9, 15)],  # Areas 9-14
                'description': 'Right section of building'
            },
            'EYD1': {
                'type': 'Electrical Yard Zone 1',
                'gen_yard': {
                    'zones': ['Zone-1', 'Zone-2', 'Zone-3'],
                    'pads': [f'Pad-{i}' for i in range(1, 10)]  # Pads 1-9
                },
                'uss_yard': {
                    'modules': [f'USS-{i:02d}' for i in range(1, 27)]  # USS 01-26
                }
            },
            'EYD2': {
                'type': 'Electrical Yard Zone 2',
                'gen_yard': {
                    'zones': ['Zone-4', 'Zone-5', 'Zone-6'],
                    'pads': [f'Pad-{i}' for i in range(10, 19)]  # Pads 10-18
                },
                'uss_yard': {
                    'modules': [f'USS-{i:02d}' for i in range(27, 53)]  # USS 27-52
                }
            },
            'MYD1': {
                'type': 'Mechanical Yard Zone 1',
                'mcp1': {
                    'zones': ['Zone-1', 'Zone-2', 'Zone-3', 'Zone-4'],
                    'pads': [f'MCP1-Pad-{i}' for i in range(1, 5)]  # Pads 1-4
                },
                'mcp2': {
                    'zones': ['Zone-5', 'Zone-6', 'Zone-7'],
                    'pads': [f'MCP2-Pad-{i}' for i in range(1, 4)]  # Pads 1-3
                }
            }
        }
        
        # Trade mapping patterns
        self.trade_patterns = {
            'mep': ['Plumbing', 'Electrical', 'Mechanical', 'Fire'],
            'mepf': ['Plumbing', 'Electrical', 'Mechanical', 'Fire'],
            'electrical': ['Electrical'],
            'plumbing': ['Plumbing'],
            'mechanical': ['Mechanical'],
            'fire': ['Fire'],
            'concrete': ['Concrete Formwork', 'Concrete Rebar', 'Concrete Pour'],
            'roofing': ['Roofing Flashing', 'Roofing Insulation', 'Roofing Membrane', 'Roofing Metal Deck'],
            'structural': ['Structural Steel'],
            'conveyance': ['Conveyance']
        }
        
        # Phase keywords
        self.phase_keywords = {
            'rough': 'Rough-in Phase',
            'finish': 'Finish Phase', 
            'trim': 'Trim Out Phase',
            'oh': 'Overhead Work',
            'final': 'Final Phase'
        }
        
        # Exclude patterns (inspections, milestones)
        self.exclude_patterns = [
            'inspection', 'commissioning', 'testing', 'milestone', 'handover'
        ]

    def parse_activity(self, activity_id, name, location, trade):
        """Parse activity name to extract location and trade information"""
        
        # Check if should be excluded
        if self._should_exclude(name):
            return self._create_excluded_result(activity_id, name, location, trade)
        
        # Extract location prefix from activity name
        location_prefix = self._extract_location_prefix(name)
        
        # Parse pad/equipment numbers
        pad_numbers = self._extract_pad_numbers(name)
        
        # Extract work phase
        work_phase = self._extract_work_phase(name)
        
        # Parse trade components
        trade_components = self._parse_trade_components(name, trade)
        
        # Get matched physical locations
        matched_locations = self._get_matched_locations(location_prefix, pad_numbers, name)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence(location_prefix, matched_locations, trade_components)
        
        return {
            'activity_id': activity_id,
            'activity_name': name,
            'schedule_location': location,
            'schedule_trade': trade,
            'parsed_location_prefix': location_prefix,
            'parsed_pad_numbers': pad_numbers,
            'parsed_work_phase': work_phase,
            'trade_components': trade_components,
            'matched_physical_locations': matched_locations,
            'confidence_score': confidence_score,
            'is_excluded': False
        }

    def _should_exclude(self, name):
        """Check if activity should be excluded from physical tracking"""
        name_lower = name.lower()
        return any(pattern in name_lower for pattern in self.exclude_patterns)

    def _create_excluded_result(self, activity_id, name, location, trade):
        """Create result for excluded activities"""
        return {
            'activity_id': activity_id,
            'activity_name': name,
            'schedule_location': location,
            'schedule_trade': trade,
            'parsed_location_prefix': '',
            'parsed_pad_numbers': [],
            'parsed_work_phase': 'Excluded',
            'trade_components': [],
            'matched_physical_locations': [],
            'confidence_score': 'EXCLUDED',
            'is_excluded': True
        }

    def _extract_location_prefix(self, name):
        """Extract location prefix from activity name"""
        # Look for patterns like DCH1-, MYD1-, EYD1-, Zone-01
        patterns = [
            r'(DCH\d+)-',  # DCH1, DCH2
            r'(MYD\d+)-',  # MYD1
            r'(EYD\d+)-',  # EYD1, EYD2
            r'(Zone-\d+)',  # Zone-01, Zone-02
            r'(FSA)',       # Facility Support Area
            r'(GPS)',       # GPS
            r'(Loading Dock)',  # Loading Dock
            r'(Booster Pump System)',  # Booster Pump System
            r'(Fire Pump House)',  # Fire Pump House
            r'(DWTR)',      # DWTR
        ]
        
        for pattern in patterns:
            match = re.search(pattern, name)
            if match:
                return match.group(1)
        
        return ''

    def _extract_pad_numbers(self, name):
        """Extract pad numbers from activity name"""
        pad_numbers = []
        
        # Look for MCP pad patterns
        mcp_patterns = [
            r'MCP(\d+)&(\d+)',  # MCP01&2
            r'MCP-(\d+)',        # MCP-04
            r'Pad-(\d+)&(\d+)',  # Pad-06&7
            r'Pad-(\d+)',        # Pad-06
        ]
        
        for pattern in mcp_patterns:
            matches = re.findall(pattern, name)
            for match in matches:
                if len(match) == 2:
                    pad_numbers.extend([int(match[0]), int(match[1])])
                else:
                    pad_numbers.append(int(match[0]))
        
        # Look for USS module patterns
        uss_patterns = [
            r'USS (\d+)',        # USS 01
            r'USS-(\d+)',        # USS-01
        ]
        
        for pattern in uss_patterns:
            matches = re.findall(pattern, name)
            for match in matches:
                pad_numbers.append(int(match))
        
        return sorted(list(set(pad_numbers)))

    def _extract_work_phase(self, name):
        """Extract work phase from activity name"""
        name_lower = name.lower()
        
        for keyword, phase in self.phase_keywords.items():
            if keyword in name_lower:
                return phase
        
        return 'Main Phase'

    def _parse_trade_components(self, name, trade):
        """Parse trade components from activity name and trade field"""
        components = []
        
        # Check if it's a multi-trade activity
        name_lower = name.lower()
        
        if 'mepf' in name_lower or 'mep' in name_lower:
            components.extend(self.trade_patterns.get('mep', []))
        elif 'electrical' in name_lower:
            components.extend(self.trade_patterns.get('electrical', []))
        elif 'plumbing' in name_lower:
            components.extend(self.trade_patterns.get('plumbing', []))
        elif 'mechanical' in name_lower:
            components.extend(self.trade_patterns.get('mechanical', []))
        elif 'concrete' in name_lower:
            components.extend(self.trade_patterns.get('concrete', []))
        elif 'roofing' in name_lower:
            components.extend(self.trade_patterns.get('roofing', []))
        elif 'structural' in name_lower:
            components.extend(self.trade_patterns.get('structural', []))
        elif 'conveyance' in name_lower:
            components.extend(self.trade_patterns.get('conveyance', []))
        else:
            # Use the trade field from schedule
            components.append(trade)
        
        return components

    def _get_matched_locations(self, location_prefix, pad_numbers, name):
        """Get matched physical locations based on parsed information"""
        locations = []
        
        if not location_prefix:
            return locations
        
        # Handle different location types
        if location_prefix.startswith('DCH'):
            if location_prefix == 'DCH1':
                locations.extend(self.location_hierarchy['DCH1']['areas'])
            elif location_prefix == 'DCH2':
                locations.extend(self.location_hierarchy['DCH2']['areas'])
        
        elif location_prefix.startswith('EYD'):
            if location_prefix == 'EYD1':
                # Add all EYD1 locations
                locations.extend(self.location_hierarchy['EYD1']['gen_yard']['pads'])
                locations.extend(self.location_hierarchy['EYD1']['uss_yard']['modules'])
            elif location_prefix == 'EYD2':
                # Add all EYD2 locations
                locations.extend(self.location_hierarchy['EYD2']['gen_yard']['pads'])
                locations.extend(self.location_hierarchy['EYD2']['uss_yard']['modules'])
        
        elif location_prefix.startswith('MYD'):
            if location_prefix == 'MYD1':
                # Add all MCP locations
                locations.extend(self.location_hierarchy['MYD1']['mcp1']['pads'])
                locations.extend(self.location_hierarchy['MYD1']['mcp2']['pads'])
        
        elif location_prefix.startswith('Zone-'):
            # Conveyance zones
            zone_num = location_prefix.split('-')[1]
            locations.append(f'Conveyance-Zone-{zone_num}')
        
        elif location_prefix in ['FSA', 'GPS', 'Loading Dock', 'Booster Pump System', 'Fire Pump House', 'DWTR']:
            # Single location items
            locations.append(location_prefix)
        
        # Filter by specific pad numbers if provided
        if pad_numbers:
            filtered_locations = []
            for location in locations:
                for pad_num in pad_numbers:
                    if str(pad_num) in location:
                        filtered_locations.append(location)
            locations = filtered_locations
        
        return locations

    def _calculate_confidence(self, location_prefix, matched_locations, trade_components):
        """Calculate confidence score for the mapping"""
        if not location_prefix:
            return 'LOW'
        
        if not matched_locations:
            return 'LOW'
        
        if len(matched_locations) > 20:  # Very broad mapping
            return 'MEDIUM'
        
        if len(matched_locations) > 10:  # Broad mapping
            return 'MEDIUM'
        
        return 'HIGH'

def generate_uno_schedule_mapping_csv():
    """Generate comprehensive CSV mapping between UNO schedule and actualised work"""
    
    # Sample schedule data (you would load this from your actual schedule)
    schedule_data = [
        # DCH Activities
        ("CON-3380", "DCH1-Remove rock & remediate soil", "DCH", "Backfill", "2025-04-27", "2025-04-28"),
        ("CON-3145", "DCH1-Pour Slab West", "DCH", "Concrete Pour", "2025-06-01", "2025-06-06"),
        ("CON-3210", "DCH1-Pour SOG Center (1)", "DCH", "Concrete Pour", "2025-06-05", "2025-06-05"),
        ("CON-3205", "DCH1-Pour Slab East (2)", "DCH", "Concrete Pour", "2025-06-08", "2025-06-08"),
        ("CON-3970", "DCH2-Pour Slab West (3)", "DCH", "Concrete Pour", "2025-06-09", "2025-06-09"),
        ("CON-4435", "DCH2-Pour Slab East", "DCH", "Concrete Pour", "2025-06-20", "2025-06-20"),
        ("CON-3710", "DCH1-Install Insulation", "DCH", "Roofing Insulation", "2025-06-13", "2025-06-28"),
        ("CON-4575", "DCH2-Install Insulation", "DCH", "Roofing Insulation", "2025-06-21", "2025-06-28"),
        
        # MYD Activities with specific pad references
        ("CON-4985", "MYD1-Backfill Pad-MCP01&2/UTC01&2", "MYD", "Backfill", "2025-05-08", "2025-05-15"),
        ("CON-5275", "MYD1-Backfill Pad-MCP-04/UTC 04", "MYD", "Backfill", "2025-05-17", "2025-05-26"),
        ("CON-6325", "MYD1-Backfill Pad-06&7/UTC 06&7", "MYD", "Backfill", "2025-06-05", "2025-06-17"),
        ("CON-5185", "MYD1-Pour Equipment Base Pad-MCP01&2 (PH2)", "MYD", "Concrete Pour", "2025-05-22", "2025-05-26"),
        ("CON-7155", "MYD1-Pour Equipment Base Pad-MCP-06 (PH 3)", "MYD", "Concrete Pour", "2025-06-19", "2025-06-22"),
        ("CON-7165", "MYD1-Pour Equipment Base Pad-MCP-06&7 (PH 4)", "MYD", "Concrete Pour", "2025-06-23", "2025-06-23"),
        
        # EYD Activities with USS references
        ("PCN-4115", "EYD1-USS 01-Set (T1)", "EYD", "Generator Placement", "2025-06-17", "2025-06-20"),
        ("PCN-4120", "EYD1-USS 02-Set (T1)", "EYD", "Generator Placement", "2025-06-17", "2025-06-20"),
        ("CON-24020", "EYD1-USS 01-Pull Primary Cabling", "EYD", "Electrical Yard Equipment Conduit", "2025-08-06", "2025-08-19"),
        ("CON-24025", "EYD1-USS 02-Pull Primary Cabling", "EYD", "Electrical Yard Equipment Conduit", "2025-08-06", "2025-08-19"),
        
        # Conveyance with specific zones
        ("PCN-1175", "Zone-01 Install Conveyance", "Conveyance", "Conveyance", "2025-05-28", "2025-06-03"),
        ("PCN-1180", "Zone-02 Install Conveyance", "Conveyance", "Conveyance", "2025-06-08", "2025-06-08"),
        ("PCN-1185", "Zone-03 Install Conveyance", "Conveyance", "Conveyance", "2025-06-18", "2025-06-19"),
        
        # Multi-trade activities
        ("B1-240", "MEPF Trim Out", "DCH", "Multi-Trade", "2025-07-01", "2025-07-15"),
        ("BG-180", "MEP Rough Inspections", "DCH", "Inspection", "2025-06-15", "2025-06-16"),
        
        # Overhead work
        ("B2-180", "Access Floor System Rough-In", "DCH", "Access Floor", "2025-07-28", "2025-08-29"),
        ("GRID-001", "Grid OH Rough Mechanical", "DCH", "Mechanical", "2025-07-01", "2025-07-10"),
        
        # Activities with direction indicators
        ("CON-3420", "DCH2-Backfill/Fine Grade & Touch Up (West to East)", "DCH", "Backfill", "2025-06-18", "2025-07-07"),
    ]
    
    # Initialize parser
    parser = UNOActivityParser()
    
    # Create CSV in memory
    output = StringIO()
    fieldnames = [
        'Activity_ID',
        'Activity_Name', 
        'Schedule_Location',
        'Schedule_Trade',
        'Schedule_Start',
        'Schedule_Finish',
        'Parsed_Location_Prefix',
        'Parsed_Pad_Numbers',
        'Parsed_Work_Phase',
        'Trade_Components',
        'Matched_Physical_Locations',
        'Number_of_Locations',
        'Confidence_Score',
        'Progress_Formula',
        'Is_Excluded',
        'Mapping_Notes'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    # Process each schedule item
    for activity_id, name, location, trade, start, finish in schedule_data:
        # Parse the activity
        parsed = parser.parse_activity(activity_id, name, location, trade)
        
        # Build the row
        row = {
            'Activity_ID': activity_id,
            'Activity_Name': name,
            'Schedule_Location': location,
            'Schedule_Trade': trade,
            'Schedule_Start': start,
            'Schedule_Finish': finish,
            'Parsed_Location_Prefix': parsed['parsed_location_prefix'],
            'Parsed_Pad_Numbers': '; '.join(map(str, parsed['parsed_pad_numbers'])) if parsed['parsed_pad_numbers'] else '',
            'Parsed_Work_Phase': parsed['parsed_work_phase'],
            'Trade_Components': '; '.join(parsed['trade_components']),
            'Matched_Physical_Locations': '; '.join(parsed['matched_physical_locations'][:10]),  # First 10
            'Number_of_Locations': len(parsed['matched_physical_locations']),
            'Confidence_Score': parsed['confidence_score'],
            'Progress_Formula': _generate_progress_formula(parsed),
            'Is_Excluded': 'Yes' if parsed['is_excluded'] else 'No',
            'Mapping_Notes': _generate_mapping_notes(parsed)
        }
        
        writer.writerow(row)
    
    return output.getvalue()

def _generate_progress_formula(parsed):
    """Generate formula for calculating progress"""
    
    if parsed['is_excluded']:
        return "N/A - Excluded from physical tracking"
    
    num_locations = len(parsed['matched_physical_locations'])
    
    if num_locations == 0:
        return "No locations matched"
    elif num_locations == 1:
        return "Binary: 0% or 100%"
    elif num_locations <= 10:
        return f"Sum(complete locations) / {num_locations} * 100%"
    else:
        return f"Weighted average across {num_locations} locations"

def _generate_mapping_notes(parsed):
    """Generate mapping notes and clarifications"""
    notes = []
    
    if parsed['is_excluded']:
        notes.append("Inspection/milestone activity - not physical work")
        return '; '.join(notes)
    
    if parsed['confidence_score'] == 'LOW':
        notes.append("Low confidence - manual review required")
    
    if len(parsed['matched_physical_locations']) > 20:
        notes.append("Very broad mapping - consider breaking down")
    
    if 'MEP' in parsed['trade_components'] and len(parsed['trade_components']) > 1:
        notes.append("Multi-trade activity - tracks 4 separate trades")
    
    if parsed['parsed_pad_numbers']:
        notes.append(f"Specific pads: {parsed['parsed_pad_numbers']}")
    
    if not notes:
        notes.append("High confidence mapping")
    
    return '; '.join(notes)

if __name__ == "__main__":
    # Generate the CSV
    csv_content = generate_uno_schedule_mapping_csv()
    
    # Save to file
    with open('uno_schedule_to_actualised_mapping.csv', 'w', newline='', encoding='utf-8') as f:
        f.write(csv_content)
    
    print("✅ UNO Schedule Mapping CSV generated successfully!")
    print("📁 File: uno_schedule_to_actualised_mapping.csv")
    print("\n📊 Sample output:")
    print(csv_content[:2000])  # Show first 2000 characters
    
    # Show summary statistics
    lines = csv_content.strip().split('\n')
    total_activities = len(lines) - 1  # Subtract header
    
    print(f"\n📈 Summary:")
    print(f"Total Activities: {total_activities}")
    print(f"CSV Fields: {len(lines[0].split(','))}")
    print(f"File Size: {len(csv_content)} characters")
