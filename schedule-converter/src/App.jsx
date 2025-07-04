import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, Download, FileText, Calendar, Clock, Users, AlertCircle, CheckCircle, Filter, X, ChevronDown, Building, Search, EyeOff, Eye } from 'lucide-react';

// Main App Component: P6 Schedule to CSV Converter
export default function App() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);

  // State for filtering and view functionality
  const [showFilters, setShowFilters] = useState(false);
  const [customKeywords, setCustomKeywords] = useState('');
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'dataCentre'
  const [selectedTrades, setSelectedTrades] = useState({
    excavation: false, utilities: false, structural_steel: false, roofing: false,
    structural_piles: false, concrete_pour: false, concrete_formwork: false,
    concrete_rebar: false, masonry: false, electrical: false, plumbing: false,
    hvac: false, insulation: false, drywall: false, flooring: false,
    painting: false, landscaping: false, other_trades: false
  });
  const [excludeKeywords, setExcludeKeywords] = useState([
    'rfp', 'rfi', 'approval', 'submittal', 'review', 'meeting', 'mobilization', 
    'demobilization', 'permit', 'inspection', 'testing', 'close out', 'closeout',
    'procurement', 'ordering', 'delivery', 'schedule', 'planning', 'coordination'
  ]);

  // State for standard view table interactions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState(new Set());
  const [hiddenActivityIds, setHiddenActivityIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Keyword mappings for general trade filtering
  const tradeKeywords = {
    excavation: ['excavat', 'dig', 'earth', 'soil', 'grade', 'cut', 'fill', 'trenching', 'backfill'],
    utilities: ['utility', 'utilities', 'water', 'sewer', 'gas', 'electric service', 'storm', 'drain'],
    structural_steel: ['steel', 'beam', 'column', 'frame', 'structural steel', 'erection', 'welding'],
    roofing: ['roof', 'shingle', 'membrane', 'flashing', 'gutter', 'downspout', 'metal deck', 'roof deck'],
    structural_piles: ['pile', 'piles', 'foundation', 'caisson', 'pier', 'deep foundation'],
    concrete_pour: ['pour', 'concrete pour', 'placement', 'concrete placement', 'slab', 'footing'],
    concrete_formwork: ['form', 'formwork', 'shoring', 'falsework', 'scaffolding'],
    concrete_rebar: ['rebar', 'reinforc', 'steel reinforc', 'reinforcing', 'bar'],
    masonry: ['masonry', 'brick', 'block', 'stone', 'mortar'],
    electrical: ['electrical', 'electric', 'wiring', 'conduit', 'panel', 'lighting'],
    plumbing: ['plumb', 'pipe', 'piping', 'fixture', 'valve'],
    hvac: ['hvac', 'heating', 'cooling', 'ventilation', 'duct', 'air condition'],
    insulation: ['insulat', 'thermal', 'vapor barrier', 'roofing insulation'],
    drywall: ['drywall', 'gypsum', 'sheetrock', 'taping', 'finishing'],
    flooring: ['floor', 'carpet', 'tile', 'hardwood', 'vinyl'],
    painting: ['paint', 'coating', 'finish', 'primer'],
    landscaping: ['landscape', 'plant', 'irrigation', 'lawn', 'tree'],
    other_trades: ['trade', 'specialty', 'subcontractor']
  };

  // Filtered data for the standard view based on trade filters
  const filteredData = useMemo(() => {
    if (!parsedData.length) return [];
    const anyTradeSelected = Object.values(selectedTrades).some(isSelected => isSelected);
    const hasCustomKeywords = customKeywords.trim() !== '';
    return parsedData.filter(activity => {
        const activityText = `${activity.name || ''} ${activity.wbs || ''}`.toLowerCase();
        if (excludeKeywords.some(k => activityText.includes(k))) return false;
        if (!anyTradeSelected && !hasCustomKeywords) return true;
        const matchesTrade = anyTradeSelected && Object.entries(selectedTrades).some(([trade, selected]) => 
            selected && tradeKeywords[trade]?.some(k => activityText.includes(k))
        );
        const matchesCustom = hasCustomKeywords && customKeywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean).some(k => activityText.includes(k));
        return matchesTrade || matchesCustom;
    });
  }, [parsedData, selectedTrades, excludeKeywords, customKeywords]);

  // Data to be displayed in the standard table view, after search and hide filters are applied
  const displayData = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return filteredData.filter(activity => {
      if (hiddenActivityIds.has(activity.id)) return false;
      if (!searchQuery) return true;
      return (
        activity.id.toLowerCase().includes(lowerCaseQuery) ||
        activity.name.toLowerCase().includes(lowerCaseQuery) ||
        (activity.wbs && activity.wbs.toLowerCase().includes(lowerCaseQuery))
      );
    });
  }, [filteredData, searchQuery, hiddenActivityIds]);

  // Paginated data for the current page
  const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return displayData.slice(startIndex, startIndex + itemsPerPage);
  }, [displayData, currentPage]);

  // Generalized structured view logic
  const structuredData = useMemo(() => {
    if (viewMode !== 'dataCentre' || !parsedData.length) return null;

    const locationKeywords = {
      DCH1: ['dch1'], DCH2: ['dch2'], DCH3: ['dch3'], DCH4: ['dch4'],
      EYD1: ['eyd1'], EYD2: ['eyd2'], EYD3: ['eyd3'], EYD4: ['eyd4'],
      FSA: ['fsa'], FUEL_STORAGE: ['fuel storage'], LOADING_BAY: ['loading bay'],
      MYD1_BLOCK_1: ['myd1 block 1', 'myd1 blk 1'], MYD1_BLOCK_2: ['myd1 block 2', 'myd1 blk 2'],
      MYD2: ['myd2'], MYD3: ['myd3'], MYD4: ['myd4'],
      NORTH_LAYDOWN: ['north laydown'], PERUN: ['perun'], WASTE_MANAGEMENT: ['waste management'],
    };

    const grouped = {};

    parsedData.forEach(activity => {
        const activityText = `${activity.name || ''} ${activity.wbs || ''}`.toLowerCase();
        for (const locKey in locationKeywords) {
            if (locationKeywords[locKey].some(k => activityText.includes(k))) {
                if (!grouped[locKey]) {
                    grouped[locKey] = { name: locKey, activities: [] };
                }
                grouped[locKey].activities.push(activity);
                break; // Assign activity to the first location it matches
            }
        }
    });
    return grouped;
  }, [parsedData, viewMode]);

  // Effect to load the pdf.js library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
      setIsPdfJsLoaded(true);
    };
    script.onerror = () => setError("Failed to load PDF processing library.");
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // File upload and parsing logic
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setError('');
    setSuccess('');
    setParsedData([]);
    setViewMode('standard');
    setSearchQuery('');
    setSelectedActivityIds(new Set());
    setHiddenActivityIds(new Set());
    setCurrentPage(1);
    setIsProcessing(true);
    try {
      const extension = uploadedFile.name.toLowerCase().split('.').pop();
      const content = await readFileContent(uploadedFile, extension === 'pdf' ? 'arrayBuffer' : 'text');
      const activities = await parseP6Data(content, uploadedFile.name);
      setParsedData(activities);
      setSuccess(`Successfully parsed ${activities.length} activities`);
      setShowFilters(true);
    } catch (err) {
      setError(`Error parsing file: ${err.message}`);
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file, readAs = 'text') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      if (readAs === 'arrayBuffer') reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  };

  const parseP6Data = async (content, filename) => {
    const extension = filename.toLowerCase().split('.').pop();
    switch(extension) {
        case 'xml': return parseXMLData(content);
        case 'xer': return parseXERData(content);
        case 'csv': return parseCSVData(content);
        case 'pdf':
            if (!isPdfJsLoaded) throw new Error('PDF library not loaded. Please wait and retry.');
            return parsePDFData(content);
        default: throw new Error('Unsupported file format. Please upload XML, XER, CSV, or PDF.');
    }
  };

  const parseXMLData = (xmlContent) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length) throw new Error("Failed to parse XML file.");
    const activities = Array.from(xmlDoc.getElementsByTagName("Activity"));
    if (!activities.length) throw new Error("No activities found in XML file.");
    return activities.map((activity, i) => ({
      id: getElementText(activity, "Id") || getElementText(activity, "ActivityId") || `ACT-${i + 1}`,
      name: getElementText(activity, "Name") || getElementText(activity, "ActivityName") || "Unnamed Activity",
      startDate: formatDate(getElementText(activity, "PlannedStartDate") || getElementText(activity, "StartDate")),
      finishDate: formatDate(getElementText(activity, "PlannedFinishDate") || getElementText(activity, "FinishDate")),
      duration: getElementText(activity, "PlannedDuration") || getElementText(activity, "Duration") || '0',
      percentComplete: getElementText(activity, "PercentComplete") || '0',
      totalFloat: getElementText(activity, "TotalFloat") || '0',
      status: getElementText(activity, "Status") || "Not Started",
      wbs: getElementText(activity, "WBSName") || getElementText(activity, "WBSCode") || "",
    }));
  };

  const parseXERData = (xerContent) => {
    const lines = xerContent.split('\n');
    let isTaskSection = false;
    let headers = [];
    const taskData = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('%T') && trimmedLine.includes('TASK')) { isTaskSection = true; continue; }
        if (isTaskSection && trimmedLine.startsWith('%F')) { headers = trimmedLine.substring(3).split('\t').map(h => h.trim()); continue; }
        if (isTaskSection && trimmedLine.startsWith('%R')) {
            const values = trimmedLine.substring(3).split('\t');
            const activity = {};
            headers.forEach((header, index) => { activity[header] = values[index] ? values[index].trim() : ''; });
            taskData.push(activity);
        }
        if (isTaskSection && trimmedLine.startsWith('%T') && !trimmedLine.includes('TASK')) break;
    }

    if (taskData.length === 0) throw new Error('No TASK records found in the XER file.');
    
    return taskData.map((activity, index) => ({
      id: activity.task_code || `XER-ACT-${index + 1}`,
      name: activity.task_name || 'Unnamed Activity',
      startDate: formatDate(activity.early_start_date),
      finishDate: formatDate(activity.early_end_date),
      duration: activity.target_drtn_hr_cnt || '0',
      percentComplete: activity.phys_complete_pct || '0',
      totalFloat: activity.total_float_hr_cnt || '0',
      status: activity.status_code || 'Not Started',
      wbs: activity.wbs_id || '',
    }));
  };

  const parseCSVData = (csvContent) => {
    const lines = csvContent.split(/[\r\n]+/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('CSV file must have a header and at least one data row.');
    
    const parseCsvRow = (row) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"' && (i === 0 || row[i-1] !== '\\')) { inQuotes = !inQuotes; } 
            else if (char === ',' && !inQuotes) { result.push(current); current = ''; } 
            else { current += char; }
        }
        result.push(current);
        return result.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().trim());
    const activities = [];

    const findHeaderIndex = (possibleNames) => {
        for (const name of possibleNames) {
            const index = headers.indexOf(name.toLowerCase());
            if (index !== -1) return index;
        }
        return -1;
    };

    const idIndex = findHeaderIndex(['activity id', 'id', 'task id']);
    const nameIndex = findHeaderIndex(['activity name', 'name', 'task name']);
    const startIndex = findHeaderIndex(['start', 'start date', 'planned start']);
    const finishIndex = findHeaderIndex(['finish', 'finish date', 'planned finish']);
    const durationIndex = findHeaderIndex(['original duration', 'duration']);
    const percentIndex = findHeaderIndex(['activity % complete', '% complete', 'percent complete']);
    const statusIndex = findHeaderIndex(['activity status', 'status']);
    const totalFloatIndex = findHeaderIndex(['total float', 'total float (days)']);
    const wbsIndex = findHeaderIndex(['wbs name', 'wbs', 'wbs code']);

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvRow(lines[i]);
        if (values.length < headers.length) continue;
        const activity = {
            id: values[idIndex] || `CSV-ACT-${i}`,
            name: values[nameIndex] || 'Unnamed Activity',
            startDate: formatDate(values[startIndex]),
            finishDate: formatDate(values[finishIndex]),
            duration: values[durationIndex] || '0',
            percentComplete: values[percentIndex] || '0',
            totalFloat: values[totalFloatIndex] || '0',
            status: values[statusIndex] || 'Not Started',
            wbs: values[wbsIndex] || '',
        };
        activities.push(activity);
    }
    
    if (activities.length === 0) throw new Error('Could not parse any valid activity rows from the CSV file.');
    return activities;
  };

  const parsePDFData = async (pdfContent) => {
      const pdf = await window.pdfjsLib.getDocument({ data: pdfContent }).promise;
      let allText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          allText += textContent.items.map(item => item.str).join(' ') + '\n';
      }
      const lines = allText.split('\n').filter(line => line.trim().length > 5);
      const activities = [];
      const rowRegex = /^([A-Z0-9]+)\s+([\w\s-]+?)\s+(\d{2}-[A-Za-z]{3}-\d{2})\s+(\d{2}-[A-Za-z]{3}-\d{2})/;
      for (const line of lines) {
          const match = line.match(rowRegex);
          if (match) {
              activities.push({
                  id: match[1] || `PDF-ACT-${activities.length + 1}`, name: match[2].trim() || 'Unnamed',
                  startDate: formatDate(match[3]), finishDate: formatDate(match[4]),
                  duration: '0', percentComplete: '0', totalFloat: '0', status: 'Not Started',
                  wbs: '', resourceNames: '', predecessors: '', successors: ''
              });
          }
      }
      if (activities.length === 0) throw new Error('Could not automatically extract activity data from PDF.');
      return activities;
  };

  const getElementText = (parent, tagName) => parent.getElementsByTagName(tagName)[0]?.textContent || "";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0];
    } catch { return dateString; }
  };

  // Export and filter logic
  const exportStandardCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Activity ID', 'Activity Name', 'Start Date', 'Finish Date', 'Duration', '% Complete', 'Total Float', 'Status', 'WBS'];
    const csvRows = [
      headers.join(','),
      ...filteredData.map(a => [
        `"${a.id}"`, `"${a.name.replace(/"/g, '""')}"`, `"${a.startDate}"`, `"${a.finishDate}"`,
        `"${a.duration}"`, `"${a.percentComplete}"`, `"${a.totalFloat}"`, `"${a.status}"`, `"${a.wbs.replace(/"/g, '""')}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `p6_filtered_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const exportDataCentreCSV = () => {
    if (!structuredData || Object.keys(structuredData).length === 0) {
        alert("No data available to export in the Data Centre view.");
        return;
    }

    const csvRows = [];
    const headers = ['Location', 'Activity ID', 'Activity Name', 'Start Date', 'Finish Date', 'Duration', '% Complete', 'Status', 'WBS'];
    csvRows.push(headers.join(','));
    
    const sortedLocationKeys = Object.keys(structuredData).sort();

    for (const locationKey of sortedLocationKeys) {
        const location = structuredData[locationKey];
        const locationName = location.name;
        
        for (const activity of location.activities) {
            const row = [
                `"${locationName}"`,
                `"${activity.id}"`,
                `"${activity.name.replace(/"/g, '""')}"`,
                `"${activity.startDate || ''}"`,
                `"${activity.finishDate || ''}"`,
                `"${activity.duration || '0'}"`,
                `"${activity.percentComplete || '0'}"`,
                `"${activity.status || 'Not Started'}"`,
                `"${(activity.wbs || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        }
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DataCentre_structured_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const resetApp = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    setSuccess('');
    setShowFilters(false);
    setCustomKeywords('');
    setViewMode('standard');
    setSearchQuery('');
    setSelectedActivityIds(new Set());
    setHiddenActivityIds(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTradeToggle = (trade) => {
    setSelectedTrades(prev => ({ ...prev, [trade]: !prev[trade] }));
  };

  const handleSelectAllTrades = () => {
    const allSelected = Object.values(selectedTrades).every(Boolean);
    const newState = Object.keys(selectedTrades).reduce((acc, trade) => {
      acc[trade] = !allSelected;
      return acc;
    }, {});
    setSelectedTrades(newState);
  };
  
  const handleRemoveExcludeKeyword = (keywordToRemove) => {
    setExcludeKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  };

  const handleAddExcludeKeyword = (newKeyword) => {
    const trimmedKeyword = newKeyword.trim().toLowerCase();
    if (trimmedKeyword && !excludeKeywords.includes(trimmedKeyword)) {
      setExcludeKeywords(prev => [...prev, trimmedKeyword]);
    }
  };
  
  const handleSelectAllOnPage = (e) => {
    const pageIds = new Set(paginatedData.map(a => a.id));
    const newSelection = new Set(selectedActivityIds);

    if (e.target.checked) {
        pageIds.forEach(id => newSelection.add(id));
    } else {
        pageIds.forEach(id => newSelection.delete(id));
    }
    setSelectedActivityIds(newSelection);
  };

  const handleSelectSingle = (id) => {
    const newSelection = new Set(selectedActivityIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedActivityIds(newSelection);
  };

  const handleHideSelected = () => {
    setHiddenActivityIds(prevHidden => new Set([...prevHidden, ...selectedActivityIds]));
    setSelectedActivityIds(new Set());
  };

  const handleShowAll = () => {
    setHiddenActivityIds(new Set());
  };

  // Accordion component for the Data Centre view
  const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div className="border rounded-lg mb-2 bg-white">
        <div className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
          {title}
          <button onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {isOpen && <div className="p-4 border-t">{children}</div>}
      </div>
    );
  };

  // Component to render the structured Data Centre view
  const StructuredView = ({ data, onExport }) => {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [hiddenItems, setHiddenItems] = useState(new Set());

    const handleGroupSelect = (groupKey, activities) => {
        const newSelection = new Set(selectedItems);
        const allActivityIds = activities.map(a => a.id);
        const areAllSelected = allActivityIds.every(id => newSelection.has(id));

        if (areAllSelected) {
            allActivityIds.forEach(id => newSelection.delete(id));
        } else {
            allActivityIds.forEach(id => newSelection.add(id));
        }
        setSelectedItems(newSelection);
    };

    const handleItemSelect = (id) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedItems(newSelection);
    };
    
    const handleHide = () => {
        setHiddenItems(prevHidden => new Set([...prevHidden, ...selectedItems]));
        setSelectedItems(new Set());
    };

    const handleShow = () => setHiddenItems(new Set());

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Data Centre Structured View</h2>
                <div className="flex gap-2">
                    <button onClick={handleHide} disabled={selectedItems.size === 0} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-sm hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        <EyeOff className="w-5 h-5" />
                        Hide Selected ({selectedItems.size})
                    </button>
                    <button onClick={handleShow} disabled={hiddenItems.size === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        <Eye className="w-5 h-5" />
                        Show All ({hiddenItems.size})
                    </button>
                    <button onClick={onExport} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md w-full sm:w-auto">
                        <Download className="w-5 h-5" />
                        Export
                    </button>
                </div>
            </div>
            {Object.keys(data).length > 0 ? Object.keys(data).sort().map(groupKey => {
                const group = data[groupKey];
                const visibleActivities = group.activities.filter(a => !hiddenItems.has(a.id));
                if (hiddenItems.has(groupKey) || visibleActivities.length === 0) return null;

                const allInGroupSelected = visibleActivities.length > 0 && visibleActivities.every(a => selectedItems.has(a.id));

                return (
                    <Accordion key={groupKey} title={
                        <div className="flex items-center w-full">
                            <input 
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                checked={allInGroupSelected}
                                onChange={() => handleGroupSelect(groupKey, visibleActivities)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {group.name}
                        </div>
                    } defaultOpen={true}>
                        <ul className="space-y-2">
                            {visibleActivities.map(act => (
                                <li key={act.id} className="flex items-center text-sm">
                                    <input 
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                        checked={selectedItems.has(act.id)}
                                        onChange={() => handleItemSelect(act.id)}
                                    />
                                    <span className="text-gray-800">{act.name} ({act.startDate || 'No Date'})</span>
                                </li>
                            ))}
                        </ul>
                    </Accordion>
                )
            }) : <p className="text-center text-gray-500 py-8">No activities matched the Data Centre structure.</p>}
        </div>
    );
  };

  const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-2 mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md bg-white disabled:opacity-50 hover:bg-gray-50">Previous</button>
            <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md bg-white disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg text-white"><Calendar className="w-8 h-8" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">P6 Schedule to CSV Converter</h1>
              <p className="text-gray-600 text-center sm:text-left">Upload, Filter by Construction Trades, and Export P6 Data</p>
            </div>
          </div>
        </header>

        <main>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
              <Upload className="mx-auto mb-4 text-blue-500 w-12 h-12" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Your P6 Schedule File</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Supports XML, XER, CSV, and PDF files.</p>
              <input ref={fileInputRef} type="file" accept=".xml,.xer,.csv,.pdf" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <label htmlFor="file-upload" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                  <FileText className="w-5 h-5" />
                  <span>{file ? 'Choose Another File' : 'Choose File'}</span>
                </label>
                {file && <button onClick={resetApp} className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">Reset</button>}
              </div>
              {file && <p className="mt-4 text-sm text-gray-600">Selected: <strong>{file.name}</strong></p>}
            </div>
            {isProcessing && <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 mt-6 rounded-r-lg flex items-center gap-3"><Clock className="w-5 h-5 animate-spin" /><span>Processing file...</span></div>}
            {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mt-6 rounded-r-lg flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
            {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 mt-6 rounded-r-lg flex items-center gap-3"><CheckCircle className="w-5 h-5" /><span>{success}</span></div>}
          </div>

          {parsedData.length > 0 && (
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={() => setViewMode('standard')} className={`px-6 py-2 rounded-lg font-semibold transition ${viewMode === 'standard' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Standard View</button>
              <button onClick={() => setViewMode('dataCentre')} className={`px-6 py-2 rounded-lg font-semibold transition ${viewMode === 'dataCentre' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Data Centre View</button>
            </div>
          )}

          {viewMode === 'standard' && parsedData.length > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                    <div className="flex items-center gap-3">
                        <Filter className="text-blue-600 w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Filter Construction Trades</h2>
                            <p className="text-gray-600">{filteredData.length} of {parsedData.length} activities match</p>
                        </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 font-semibold">{showFilters ? 'Hide' : 'Show'}</button>
                </div>

                {showFilters && (
                    <div className="pt-4 border-t border-gray-200 mt-4 space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-800">Trade Categories</h3><button onClick={handleSelectAllTrades} className="text-sm font-medium text-blue-600 hover:underline">{Object.values(selectedTrades).every(Boolean) ? 'Deselect All' : 'Select All'}</button></div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {Object.keys(tradeKeywords).map((trade) => (
                                    <label key={trade} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100"><input type="checkbox" checked={selectedTrades[trade]} onChange={() => handleTradeToggle(trade)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-sm text-gray-700 capitalize">{trade.replace(/_/g, ' ')}</span></label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-800">Additional Keywords to Include</h3>
                                <button onClick={() => setCustomKeywords('')} className="text-sm font-medium text-blue-600 hover:underline">Clear</button>
                            </div>
                            <input type="text" value={customKeywords} onChange={(e) => setCustomKeywords(e.target.value)} placeholder="e.g., demolition, site work" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-800">Keywords to Exclude</h3>
                                <button onClick={() => setExcludeKeywords([])} className="text-sm font-medium text-blue-600 hover:underline">Clear All</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {excludeKeywords.map((keyword) => (<span key={keyword} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">{keyword}<button onClick={() => handleRemoveExcludeKeyword(keyword)} className="ml-1.5 text-red-500 hover:text-red-700"><X size={12} /></button></span>))}
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddExcludeKeyword(e.currentTarget.keyword.value); e.currentTarget.keyword.value = ''; }} className="flex gap-2"><input name="keyword" type="text" placeholder="Add keyword to exclude" className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" /><button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm">Add</button></form>
                        </div>
                    </div>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Filtered Schedule Preview</h2>
                        <p className="text-gray-600">{displayData.length} of {filteredData.length} activities showing</p>
                    </div>
                    <button onClick={exportStandardCSV} disabled={filteredData.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md w-full sm:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"><Download className="w-5 h-5" />Export Filtered CSV</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text"
                            placeholder="Search by ID, Name, or WBS..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleHideSelected} disabled={selectedActivityIds.size === 0} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-sm hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                            <EyeOff className="w-5 h-5" />
                            Hide Selected ({selectedActivityIds.size})
                        </button>
                        <button onClick={handleShowAll} disabled={hiddenActivityIds.size === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                            <Eye className="w-5 h-5" />
                            Show All ({hiddenActivityIds.size})
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="p-4">
                                    <input type="checkbox" 
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        onChange={handleSelectAllOnPage}
                                        checked={paginatedData.length > 0 && paginatedData.every(a => selectedActivityIds.has(a.id))}
                                    />
                                </th>
                                <th scope="col" className="px-4 py-3">ID</th>
                                <th scope="col" className="px-4 py-3">Activity Name</th>
                                <th scope="col" className="px-4 py-3">Start</th>
                                <th scope="col" className="px-4 py-3">Finish</th>
                                <th scope="col" className="px-4 py-3">% Comp</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((activity) => (
                                <tr key={activity.id} className={`bg-white border-b hover:bg-gray-50 ${selectedActivityIds.has(activity.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4">
                                        <input type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedActivityIds.has(activity.id)}
                                            onChange={() => handleSelectSingle(activity.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{activity.id}</td>
                                    <td className="px-4 py-3">{activity.name}</td>
                                    <td className="px-4 py-3">{activity.startDate}</td>
                                    <td className="px-4 py-3">{activity.finishDate}</td>
                                    <td className="px-4 py-3">{parseFloat(activity.percentComplete || 0).toFixed(1)}%</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(activity.percentComplete) >= 100 ? 'bg-green-100 text-green-800' : parseFloat(activity.percentComplete) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{activity.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    totalItems={displayData.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
                {displayData.length === 0 && filteredData.length > 0 && <p className="text-center text-sm text-gray-600 mt-4 py-8">No activities match your search query.</p>}
              </div>
            </>
          )}

          {viewMode === 'dataCentre' && structuredData && (
            <StructuredView data={structuredData} onExport={exportDataCentreCSV} />
          )}
        </main>
      </div>
    </div>
  );
}
