# Parent Folders View - Construction Activity Grouping

## What Was Implemented

The Schedule Converter now intelligently groups construction activities using **Activity Code Type 205 ("Type of Work")** from your XER files.

## How It Works

### 1. Activity Code Recognition
The parser now reads three XER tables:
- **ACTVTYPE**: Activity code type definitions
- **ACTVCODE**: Individual activity codes and their values
- **TASKACTV**: Links between tasks and activity codes

### 2. Construction Trade Mapping
Activity Code Type 205 codes are mapped to friendly construction group names:

| Code | Full Name in XER | Mapped Display Name |
|------|------------------|---------------------|
| M | Site Preparation and Excavation | Site & Excavation |
| N | Foundations | Foundations |
| P | Structure | Structure |
| Q | Enclosure | Enclosure |
| S | Interior Rough-In | Interior Rough-In |
| T | Equipment | Equipment |
| U | Drywall and Interior Finishes | Finishes |
| V | Site Improvements | Site Improvements |

### 3. Non-Construction Codes (Filtered Out)
These codes are recognized but excluded when "Construction Only" is enabled:

| Code | Type | Display |
|------|------|---------|
| A | Milestones | (Milestones) |
| D | Design | (Design) |
| E | Pre-Construction | (Pre-Construction) |
| H | Procurement | (Procurement) |
| L | Mobilization | (Mobilization) |
| X | Close-Out | (Close-Out) |

## How to Use

1. **Upload your XER file** in the Schedule Converter
2. Click **"Process"** to parse the schedule
3. Switch to **"Parent Folders"** view (top right toggle)
4. Enable **"Construction Only"** checkbox to filter out non-construction activities
5. View activities grouped by construction trade/discipline

## Features

### Summary Stats
- Total activities count
- Number of construction groups
- Filter status indicator

### Activity Details Table
For each group, you'll see:
- Activity ID
- Activity Name
- Start Date
- Finish Date
- Duration
- WBS Path (full hierarchy)
- Predicted Location
- Predicted Trade Name

## Fallback Logic

If Activity Code Type 205 is not found, the parser falls back to:
1. Other activity code types (Discipline, Trade, Division, CSI, etc.)
2. WBS parent folder names
3. Keyword detection in activity names

## Your Schedule Structure

Based on `UNO3A-MO-FGMP (3).xer`:
- **Total Activities**: ~58,000+ tasks
- **Activity Code Types**: 3 (Type of Work, Stage, Responsibility)
- **WBS Levels**: 4+ levels
- **Phases**: Project Management, Procurement, Construction

## Access

View at: http://localhost:5500/DroneDeploy%20Product%20Design%20Prototypes%20Q4%202025/scheduleconverter/

## Technical Details

### XER Parser Enhancements
- Reads WBS table and builds full hierarchical paths
- Parses ACTVTYPE/ACTVCODE/TASKACTV tables
- Links activity codes to individual tasks
- Maps code IDs to friendly names

### Grouping Algorithm
1. Extract Activity Code Type 205 for each task
2. Match first character of code value to mapping table
3. Group activities by mapped construction name
4. Apply construction-only filter if enabled
5. Sort groups alphabetically (with "Other" at end)

## Notes

- Activities without Activity Code 205 will appear in "Other" group
- Summary tasks (WBS nodes) are excluded from the activity list
- The parser is resilient: if codes aren't present, it falls back to other methods
- All original filtering (location, trade, duration, etc.) still applies before grouping



