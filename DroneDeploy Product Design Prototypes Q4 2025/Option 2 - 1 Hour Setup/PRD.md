# Product Requirements Document (PRD)
## Construction Project Onboarding Accelerator

### Executive Summary
An internal tool to reduce construction project onboarding time from 4 weeks to 2 weeks by automating schedule parsing, trade identification, and progress tracking setup through an intelligent three-panel interface.

## 1. Problem Statement

### Current State Pain Points
- **Manual schedule parsing**: Hundreds of pages of schedules with unclear line items
- **Trade identification complexity**: Ambiguous terminology (e.g., "SOG" = concrete) requires manual research
- **Noise filtering**: Majority of schedule items are non-trackable (RFPs, manufacturing, sign-offs)
- **Time investment**: Current onboarding takes 4 weeks per project
- **Knowledge loss**: No systematic capture of trade naming patterns per customer

### Opportunity
Create an AI-powered interface that accelerates project setup while maintaining human oversight and building institutional knowledge about customer-specific terminology.

## 2. Solution Overview

### Core Concept
A three-panel notebook-style interface that:
1. Ingests project materials (schedules, images, floor plans)
2. Parses information using AI with human verification
3. Outputs validated schedule and location data ready for progress tracking

### Key Principles
- **Trust but verify**: AI suggestions with human override capability
- **Progressive learning**: System improves within customer context
- **Transparent handoff**: Same interface for internal setup and customer approval

## 3. User Personas & Workflows

### Primary Persona: Internal Onboarding Specialist
- **Role**: DroneDeploy employee responsible for project setup
- **Goals**: Quickly identify trackable construction activities, map customer terminology to standard trades, create an accurate tracking foundation
- **Pain Points**: Decoding customer-specific terminology, filtering noise from schedules, maintaining consistency across projects

### Secondary Persona: Customer Validator
- **Role**: VDC Manager or Project Executive
- **Goals**: Verify setup accuracy, make final adjustments, sign off on tracking configuration
- **Pain Points**: Limited time for review, need confidence in AI interpretations

### Workflow
1. Internal specialist uploads materials → 
2. AI parses and suggests mappings → 
3. Specialist reviews/corrects → 
4. System generates outputs → 
5. Customer reviews in same interface → 
6. Customer approves or requests changes → 
7. Final configuration deployed

## 4. Functional Requirements

### 4.1 Input Panel (Left)

#### File Ingestion
**Supported formats:**
- **Schedules**: P6 (.xer), MS Project (.mpp), Excel (.xlsx), PDF (text-based)
- **Images**: 360 photos, drone captures, progress photos, BIM screenshots
- **Floor plans**: PDF, DWG, PNG/JPG

**Interaction**: Drag-and-drop with multi-file support
**File management**: List view with ability to remove/reorder

#### Trade Database
- **Pre-loaded templates**: Data Center template (default trades), Residential template (default trades)
- **Customization**: Add/edit/remove trades per template
- **Persistence**: Save modifications for future use

### 4.2 Parsing Panel (Center)

#### Intelligence Layer
- **Trade Recognition**: AI suggests mapping for ambiguous terms
- **Confidence score display**: (e.g., "SOG → Concrete Pour [87% confidence]")
- **Accept/Reject/Edit buttons**: For each suggestion

#### Activity Filtering
- **Auto-identify non-trackable items** (RFPs, procurement, administrative)
- **Move to "Excluded Items" section**
- **"Restore" button** to bring items back if needed

#### Real-time Preview
- **Show extracted schedule items** as they're processed
- **Visual indicators** for: ✓ Mapped, ⚠️ Needs Review, ✗ Excluded
- **Inline editing** of trade assignments

#### [Updated] UI Controls for Scale
**Handling Large Schedules**: The panel must include controls to efficiently manage schedules with 10,000+ line items.

- **Search & Filter**: Include a search bar to find specific line items and filters for status (e.g., Needs Review, Excluded, Confidence <75%)
- **Batch Actions**: Provide the ability to batch-accept suggestions with a confidence score above a user-defined threshold (e.g., 95%)

#### Learning System
- **Customer-specific dictionary**: Build terminology map per customer
- **Correction tracking**: Log all user overrides
- **Review queue**: Flag high-impact learnings for specialist review

**[Updated] Data Strategy**: The AI model will be seeded with a Global Trade Dictionary derived from our internal templates. For new customers, all suggestions will come from this global model. As an Internal Specialist makes corrections for a specific customer, a separate, isolated "Customer Dictionary" is built. For subsequent projects from that same customer, the AI will prioritize suggestions from the Customer Dictionary before falling back to the Global Dictionary. The "Review queue" will be used by senior specialists to approve or reject corrections before they permanently modify a Customer Dictionary.

### 4.3 Output Panel (Right)

#### Schedule Visualization
- **Gantt Chart View**: Timeline with all trackable activities, preserving key dependencies (e.g., Finish-to-Start) from the source file
- **Trade-based color coding**

#### Location Visualization
- **Floor Plan View**: Uploaded floor plan as a base layer
- **Room-level granularity**: Per floor, trades are mapped to specific locations
- **Visual heat map**: Of activity density

#### Validation Controls
- **Edit Mode**: Modify trade assignments, durations, locations
- **Change tracking**: Log all modifications for audit trail
- **Export options**: Download as CSV, PDF, or Progress AI format

## 5. Non-Functional Requirements

- **Performance**: Process 500-page schedule in <30 seconds; real-time UI updates
- **Intelligence**: 85%+ accuracy on trade identification after 3 projects per customer
- **Usability**: Single-page application with keyboard shortcuts and undo/redo
- **Security & Compliance**: Audit log, customer data isolation, and no cross-customer learning contamination

## 6. User Interface Specifications

- **Layout**: Three-panel design (Input, Parsing, Output)
- **Interactions**: Collapsible panels, synchronized scrolling, bi-directional updates
- **Visual Design**: Progress indicators, color-coded confidence scores, "diff" view for changes

## 7. Success Metrics

### Primary KPIs
- **Setup time reduction** (4 wks → 2 wks)
- **First-pass accuracy** (>80%)
- **Customer approval rate** (>90%)

### Secondary KPIs
- **Learning effectiveness**
- **User efficiency**
- **Rework rate**

### Monitoring
- Time spent per panel
- Number of manual corrections
- Most common unmapped terms

## 8. Implementation Phases

### Phase 1: MVP (Months 1-2)
- Basic three-panel interface
- Schedule parsing (P6, Excel)
- Manual trade mapping
- Simple Gantt output

### Phase 2: Intelligence (Months 3-4)
- AI trade recognition
- Confidence scoring
- Customer-specific learning
- PDF schedule support

### Phase 3: Spatial (Months 5-6) [Updated]
- **Floor plan upload**: Users can upload floor plan images (PDF, PNG, JPG)
- **Manual Location Zoning**: The specialist will be provided with tools to manually draw polygonal zones on the floor plan (e.g., "Zone A," "Floor 2 - West Wing"). Automatic room parsing from floor plans is not in scope for this phase
- **Location Assignment**: The specialist can then assign schedule activities to these user-defined zones
- **Visual progress tracking setup**: The output will be a spatially configured project ready for tracking

### Future Considerations
- Self-service customer portal
- Advanced conflict resolution

## 9. Risks & Mitigations

### Risk Matrix

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **[Updated] Complex File Format Parsing** | High | Medium | Conduct a Phase 0 technical spike to evaluate and select robust third-party libraries or APIs for parsing proprietary .xer and .mpp files. Define clear limitations on PDF parsing (e.g., text-based only). |
| **AI misidentifies critical trade** | High | Medium | Human review is required for all mappings; establish confidence thresholds below which items are automatically flagged for mandatory review. |
| **Customer rejects setup** | High | Low | Customer preview and sign-off process is built into the core workflow. |
| **Learning creates bad patterns** | Medium | Medium | Implement a review queue for high-impact or low-confidence changes before they are saved to a customer's dictionary. |
| **Complex schedules cause timeout** | Medium | Low | Implement chunked server-side processing for large files with clear progress indicators in the UI. |
