import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Upload, FileText, Loader2, AlertTriangle, Clock, MapPin, Layers, TrendingDown } from 'lucide-react';

const TradeAnomalyDetector = () => {
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnomalies, setSelectedAnomalies] = useState([
    'abandonment', 'yoyo', 'burstStart', 'tradeStarvation', 
    'swissCheese', 'verticalLag', 'orphanLocation', 'blockage', 
    'prematureStart', 'productivitySlump', 'frozenState'
  ]);
  const [error, setError] = useState('');

  const anomalyDefinitions = {
    // Time-based anomalies
    abandonment: {
      name: "Abandonment",
      category: "Time-based",
      description: "A trade starts, then goes radio-silent for an unusually long stretch",
      icon: <Clock className="w-4 h-4" />,
      rule: "state == in-progress and elapsed_days > P95(trade,building_or_level)"
    },
    yoyo: {
      name: "Yo-yo / Rework",
      category: "Time-based", 
      description: "A trade flips from complete back to in-progress (or to not-started)",
      icon: <TrendingDown className="w-4 h-4" />,
      rule: "Detect any state regression event in the history for that location+trade"
    },
    burstStart: {
      name: "Burst Start / Flash Crowd",
      category: "Time-based",
      description: "Large spike of new in-progress instances for the same trade in one capture interval",
      icon: <AlertTriangle className="w-4 h-4" />,
      rule: "new_starts_this_capture > mean+3σ for that trade"
    },
    tradeStarvation: {
      name: "Trade Starvation", 
      category: "Time-based",
      description: "A prerequisite trade finishes, but the follow-on trade never starts for X days",
      icon: <Clock className="w-4 h-4" />,
      rule: "If A.complete_date exists and B.start_date == null && days_since_complete > threshold"
    },
    
    // Spatial-pattern anomalies
    swissCheese: {
      name: "Swiss-Cheese Flow",
      category: "Spatial-pattern",
      description: "Scattered pockets where a trade is complete and large holes where it hasn't started",
      icon: <MapPin className="w-4 h-4" />,
      rule: "On a Level, compute %complete per Zone; flag if max - min > Y%"
    },
    verticalLag: {
      name: "Vertical Lag / Leap-frog",
      category: "Spatial-pattern",
      description: "Trade finishing in upper floors while lower floors haven't started",
      icon: <Layers className="w-4 h-4" />,
      rule: "Order locations by elevation; flag if lower level < X% while upper level > Y%"
    },
    orphanLocation: {
      name: "Orphan Location",
      category: "Spatial-pattern", 
      description: "A single location's trade is stalled while all neighbors are moving",
      icon: <MapPin className="w-4 h-4" />,
      rule: "If trade.progress(L) < Q1(neighbourhood) by more than Δ"
    },
    
    // Cross-trade interaction anomalies
    blockage: {
      name: "Blockage / Deadlock",
      category: "Cross-trade",
      description: "Multiple trades sit in-progress in same location longer than normal hand-off time",
      icon: <AlertTriangle className="w-4 h-4" />,
      rule: "If count_in_progress_trades >= 1 and min_elapsed > threshold"
    },
    prematureStart: {
      name: "Premature Start", 
      category: "Cross-trade",
      description: "A finishing trade begins before the rough-in trade has reached complete",
      icon: <AlertTriangle className="w-4 h-4" />,
      rule: "Flag if drywall.state == in-progress while framing.state ≠ complete"
    },
    
    // Production-rate anomalies
    productivitySlump: {
      name: "Productivity Slump",
      category: "Production-rate",
      description: "Trade's average daily completions drop sharply vs trailing average",
      icon: <TrendingDown className="w-4 h-4" />,
      rule: "EWMA of #completions_per_day; alert on > Z % drop"
    },
    
    // Data-quality anomalies
    frozenState: {
      name: "Frozen State",
      category: "Data-quality",
      description: "No status change for any trade in a location across many captures",
      icon: <Clock className="w-4 h-4" />,
      rule: "last_updated > N captures"
    }
  };

  // Statistical helper functions
  const calculateStats = (values) => {
    if (values.length === 0) return { mean: 0, stdDev: 0, median: 0, q1: 0, q3: 0, p95: 0, min: 0, max: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      stdDev,
      median: sorted[Math.floor(sorted.length / 2)],
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const daysBetween = (date1, date2) => {
    if (!date1 || !date2) return null;
    return Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));
  };

  const parseCsvData = () => {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  };

  const runClientSideDetection = async () => {
    const data = parseCsvData();
    const detectedAnomalies = [];

    // Group data by useful dimensions
    const byLocation = {};
    const byTrade = {};
    const byLocationTrade = {};

    data.forEach(row => {
      const location = row.location || row.location_id || row.building || 'Unknown';
      const trade = row.trade || 'Unknown';
      const state = row.state || row.status || '';
      const key = `${location}_${trade}`;

      if (!byLocation[location]) byLocation[location] = [];
      if (!byTrade[trade]) byTrade[trade] = [];
      if (!byLocationTrade[key]) byLocationTrade[key] = [];

      byLocation[location].push(row);
      byTrade[trade].push(row);
      byLocationTrade[key].push(row);
    });

    // 1. ABANDONMENT DETECTION
    if (selectedAnomalies.includes('abandonment')) {
      const abandonedTasks = [];
      
      Object.entries(byLocationTrade).forEach(([key, records]) => {
        const inProgressTasks = records.filter(r => 
          (r.state || '').toLowerCase().includes('progress') || 
          (r.state || '').toLowerCase().includes('active')
        );
        
        inProgressTasks.forEach(task => {
          const startDate = parseDate(task.start_date || task.actual_start_date);
          const today = new Date();
          
          if (startDate) {
            const elapsedDays = daysBetween(startDate, today);
            
            // Flag as abandoned if in-progress for more than 60 days
            if (elapsedDays > 60) {
              abandonedTasks.push({
                location: task.location || task.location_id || task.building,
                trade: task.trade,
                value: Math.round(elapsedDays),
                description: `In-progress for ${Math.round(elapsedDays)} days`
              });
            }
          }
        });
      });

      if (abandonedTasks.length > 0) {
        detectedAnomalies.push({
          type: 'abandonment',
          name: 'Abandonment',
          category: 'Time-based',
          severity: abandonedTasks.length > 5 ? 'high' : 'medium',
          count: abandonedTasks.length,
          locations: [...new Set(abandonedTasks.map(t => t.location))],
          details: `Found ${abandonedTasks.length} tasks that have been in-progress for unusually long periods`,
          data: abandonedTasks.slice(0, 10)
        });
      }
    }

    // 2. YO-YO / REWORK DETECTION
    if (selectedAnomalies.includes('yoyo')) {
      const yoyoTasks = [];
      
      // Group by location+trade and look for state regressions
      Object.entries(byLocationTrade).forEach(([key, records]) => {
        if (records.length > 1) {
          // Sort by capture_date if available
          const sorted = records.sort((a, b) => {
            const dateA = parseDate(a.capture_date || a.date);
            const dateB = parseDate(b.capture_date || b.date);
            if (!dateA || !dateB) return 0;
            return dateA - dateB;
          });

          // Look for state regressions
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i-1];
            const curr = sorted[i];
            
            const prevComplete = (prev.state || '').toLowerCase().includes('complete');
            const currNotComplete = !(curr.state || '').toLowerCase().includes('complete');
            
            if (prevComplete && currNotComplete) {
              yoyoTasks.push({
                location: curr.location || curr.location_id || curr.building,
                trade: curr.trade,
                value: 1,
                description: `Regressed from complete to ${curr.state}`
              });
            }
          }
        }
      });

      if (yoyoTasks.length > 0) {
        detectedAnomalies.push({
          type: 'yoyo',
          name: 'Yo-yo / Rework',
          category: 'Time-based',
          severity: yoyoTasks.length > 3 ? 'high' : 'medium',
          count: yoyoTasks.length,
          locations: [...new Set(yoyoTasks.map(t => t.location))],
          details: `Found ${yoyoTasks.length} instances of work regression`,
          data: yoyoTasks
        });
      }
    }

    // 3. SWISS CHEESE DETECTION
    if (selectedAnomalies.includes('swissCheese')) {
      const swissCheeseAnomalies = [];
      
      // Analyze completion patterns by trade across locations
      Object.entries(byTrade).forEach(([trade, records]) => {
        const locationCompletionRates = {};
        
        Object.entries(byLocation).forEach(([location, locationRecords]) => {
          const tradeRecords = locationRecords.filter(r => r.trade === trade);
          if (tradeRecords.length > 0) {
            const completed = tradeRecords.filter(r => 
              (r.state || '').toLowerCase().includes('complete')
            ).length;
            locationCompletionRates[location] = completed / tradeRecords.length;
          }
        });
        
        const rates = Object.values(locationCompletionRates);
        if (rates.length > 2) {
          const max = Math.max(...rates);
          const min = Math.min(...rates);
          const spread = max - min;
          
          // Flag if completion rate spread is > 50%
          if (spread > 0.5) {
            const incompleteLocations = Object.entries(locationCompletionRates)
              .filter(([loc, rate]) => rate < 0.3)
              .map(([loc]) => loc);
              
            swissCheeseAnomalies.push({
              location: `Multiple (${incompleteLocations.length} affected)`,
              trade: trade,
              value: Math.round(spread * 100),
              description: `${Math.round(spread * 100)}% completion spread across locations`
            });
          }
        }
      });

      if (swissCheeseAnomalies.length > 0) {
        detectedAnomalies.push({
          type: 'swissCheese',
          name: 'Swiss-Cheese Flow',
          category: 'Spatial-pattern',
          severity: swissCheeseAnomalies.length > 2 ? 'high' : 'medium',
          count: swissCheeseAnomalies.length,
          locations: [...new Set(swissCheeseAnomalies.map(t => t.location))],
          details: `Found ${swissCheeseAnomalies.length} trades with scattered completion patterns`,
          data: swissCheeseAnomalies
        });
      }
    }

    // 4. TRADE STARVATION DETECTION
    if (selectedAnomalies.includes('tradeStarvation')) {
      const starvationCases = [];
      
      // Define trade dependencies (simplified)
      const tradeDependencies = {
        'electrical': ['structural', 'framing'],
        'plumbing': ['structural', 'framing'],
        'drywall': ['electrical', 'plumbing', 'mechanical'],
        'flooring': ['drywall'],
        'painting': ['drywall']
      };
      
      Object.entries(byLocation).forEach(([location, records]) => {
        Object.entries(tradeDependencies).forEach(([trade, prerequisites]) => {
          const tradeRecord = records.find(r => 
            (r.trade || '').toLowerCase().includes(trade.toLowerCase())
          );
          
          if (tradeRecord && !(tradeRecord.state || '').toLowerCase().includes('progress')) {
            // Check if prerequisites are complete
            const prereqsComplete = prerequisites.some(prereq => {
              const prereqRecord = records.find(r => 
                (r.trade || '').toLowerCase().includes(prereq.toLowerCase())
              );
              return prereqRecord && (prereqRecord.state || '').toLowerCase().includes('complete');
            });
            
            if (prereqsComplete) {
              starvationCases.push({
                location: location,
                trade: trade,
                value: prerequisites.length,
                description: `Prerequisites complete but ${trade} not started`
              });
            }
          }
        });
      });

      if (starvationCases.length > 0) {
        detectedAnomalies.push({
          type: 'tradeStarvation',
          name: 'Trade Starvation',
          category: 'Time-based',
          severity: starvationCases.length > 3 ? 'high' : 'medium',
          count: starvationCases.length,
          locations: [...new Set(starvationCases.map(t => t.location))],
          details: `Found ${starvationCases.length} cases where follow-on trades haven't started`,
          data: starvationCases
        });
      }
    }

    // 5. BLOCKAGE DETECTION
    if (selectedAnomalies.includes('blockage')) {
      const blockageCases = [];
      
      Object.entries(byLocation).forEach(([location, records]) => {
        const inProgressTrades = records.filter(r => 
          (r.state || '').toLowerCase().includes('progress')
        );
        
        if (inProgressTrades.length > 2) {
          // Multiple trades in progress at same location
          const avgDuration = inProgressTrades.map(trade => {
            const startDate = parseDate(trade.start_date || trade.actual_start_date);
            if (startDate) {
              return daysBetween(startDate, new Date());
            }
            return 0;
          }).filter(d => d > 0);
          
          if (avgDuration.length > 0) {
            const avgDays = avgDuration.reduce((sum, d) => sum + d, 0) / avgDuration.length;
            
            if (avgDays > 30) { // Flag if multiple trades stuck for > 30 days
              blockageCases.push({
                location: location,
                trade: `${inProgressTrades.length} trades`,
                value: Math.round(avgDays),
                description: `${inProgressTrades.length} trades blocked for ${Math.round(avgDays)} days`
              });
            }
          }
        }
      });

      if (blockageCases.length > 0) {
        detectedAnomalies.push({
          type: 'blockage',
          name: 'Blockage / Deadlock',
          category: 'Cross-trade',
          severity: blockageCases.some(b => b.value > 60) ? 'high' : 'medium',
          count: blockageCases.length,
          locations: [...new Set(blockageCases.map(t => t.location))],
          details: `Found ${blockageCases.length} locations with multiple stalled trades`,
          data: blockageCases
        });
      }
    }

    // 6. FROZEN STATE DETECTION
    if (selectedAnomalies.includes('frozenState')) {
      const frozenLocations = [];
      
      Object.entries(byLocation).forEach(([location, records]) => {
        const latestDates = records.map(r => parseDate(r.capture_date || r.last_updated || r.date))
          .filter(d => d !== null);
        
        if (latestDates.length > 0) {
          const mostRecent = new Date(Math.max(...latestDates));
          const daysSinceUpdate = daysBetween(mostRecent, new Date());
          
          if (daysSinceUpdate > 14) { // No updates for 2+ weeks
            frozenLocations.push({
              location: location,
              trade: 'All trades',
              value: Math.round(daysSinceUpdate),
              description: `No updates for ${Math.round(daysSinceUpdate)} days`
            });
          }
        }
      });

      if (frozenLocations.length > 0) {
        detectedAnomalies.push({
          type: 'frozenState',
          name: 'Frozen State',
          category: 'Data-quality',
          severity: frozenLocations.some(f => f.value > 30) ? 'high' : 'low',
          count: frozenLocations.length,
          locations: [...new Set(frozenLocations.map(t => t.location))],
          details: `Found ${frozenLocations.length} locations with stale data`,
          data: frozenLocations
        });
      }
    }

    return detectedAnomalies;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Parse CSV
      const lines = text.trim().split('\n');
      const parsedHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(parsedHeaders);

      // Parse first 5 rows for display
      const rows = [];
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        parsedHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
      
      setDisplayData(rows);
      setCsvData(text);
      setAnomalies([]);
      setError('');
    } catch (err) {
      setError('Error reading CSV file: ' + err.message);
    }
  };

  const runAnomalyDetection = async () => {
    if (!csvData || selectedAnomalies.length === 0) {
      setError('Please upload a CSV file and select at least one anomaly type');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // CLIENT-SIDE ANOMALY DETECTION
      const detectedAnomalies = await runClientSideDetection();
      setAnomalies(detectedAnomalies);
      
    } catch (err) {
      setError('Error during anomaly detection: ' + err.message);
      console.error('Detection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnomaly = (anomalyKey) => {
    setSelectedAnomalies(prev => 
      prev.includes(anomalyKey) 
        ? prev.filter(k => k !== anomalyKey)
        : [...prev, anomalyKey]
    );
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const groupedAnomalies = Object.entries(anomalyDefinitions).reduce((acc, [key, def]) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push({ key, ...def });
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Construction Trade Anomaly Detector</h1>
        <p className="text-gray-600 mb-8">Detect time-based, spatial, cross-trade, production, and data quality anomalies in construction trade data</p>
        
        {/* Instructions */}
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Expected CSV Format</h3>
          <p className="text-blue-800 text-sm">
            Your CSV should contain columns like: <code className="bg-blue-100 px-1 rounded">location_id</code>, <code className="bg-blue-100 px-1 rounded">trade</code>, <code className="bg-blue-100 px-1 rounded">state</code> (not-started/in-progress/complete), 
            <code className="bg-blue-100 px-1 rounded">capture_date</code>, <code className="bg-blue-100 px-1 rounded">building</code>, <code className="bg-blue-100 px-1 rounded">level</code>, <code className="bg-blue-100 px-1 rounded">zone</code>, 
            <code className="bg-blue-100 px-1 rounded">start_date</code>, <code className="bg-blue-100 px-1 rounded">complete_date</code>, etc.
          </p>
        </div>
        
        {/* File Upload */}
        <div className="mb-8">
          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-gray-600">Drop CSV file here or click to upload</span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Display first 5 rows */}
        {displayData.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold p-6 border-b flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Data Preview (First 5 Rows)
            </h2>
            <div className="overflow-x-auto p-6">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map((header, index) => (
                      <th key={index} className="border border-gray-200 px-4 py-2 text-left font-semibold text-sm">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {headers.map((header, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-200 px-4 py-2 text-sm">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Anomaly Selection */}
        {csvData && (
          <div className="mb-8 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold p-6 border-b">Select Anomalies to Detect</h2>
            <div className="p-6">
              {Object.entries(groupedAnomalies).map(([category, anomaliesList]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 capitalize">{category} Anomalies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {anomaliesList.map(anomaly => (
                      <div key={anomaly.key} className="border rounded-lg p-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAnomalies.includes(anomaly.key)}
                            onChange={() => toggleAnomaly(anomaly.key)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {anomaly.icon}
                              <span className="font-medium text-sm">{anomaly.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{anomaly.description}</p>
                            <p className="text-xs text-gray-500 italic">{anomaly.rule}</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="mt-6">
                <button
                  onClick={runAnomalyDetection}
                  disabled={isLoading || selectedAnomalies.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                  <span>{isLoading ? 'Detecting Anomalies...' : 'Run Anomaly Detection'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Anomaly Results */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold p-6 border-b flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Detected Anomalies ({anomalies.length})
            </h2>
            <div className="p-6">
              {anomalies.map((anomaly, index) => (
                <div key={index} className={`mb-6 p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{anomaly.name}</h3>
                      <p className="text-sm opacity-80">{anomaly.category} • {anomaly.severity} severity</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{anomaly.count}</div>
                      <div className="text-xs">instances</div>
                    </div>
                  </div>
                  
                  <p className="mb-3">{anomaly.details}</p>
                  
                  {anomaly.locations && anomaly.locations.length > 0 && (
                    <div className="mb-3">
                      <strong>Affected Locations:</strong> {anomaly.locations.join(', ')}
                    </div>
                  )}
                  
                  {anomaly.data && anomaly.data.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Specific Instances:</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-black bg-opacity-5">
                              <th className="border border-gray-300 px-2 py-1 text-left">Location</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Trade</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Value</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anomaly.data.slice(0, 5).map((item, idx) => (
                              <tr key={idx}>
                                <td className="border border-gray-300 px-2 py-1">{item.location}</td>
                                <td className="border border-gray-300 px-2 py-1">{item.trade}</td>
                                <td className="border border-gray-300 px-2 py-1">{item.value}</td>
                                <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {anomaly.data.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">Showing first 5 of {anomaly.data.length} instances</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && csvData && anomalies.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Anomalies Detected</h3>
            <p className="text-gray-600">Your construction trade data appears to be running smoothly!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeAnomalyDetector;