import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';

/**
 * Parse and analyze construction schedules (XER or CSV format)
 * Extracts activities, trade information, dependencies, and provides insights
 */
export async function analyzeSchedule(args) {
  const { file_path, analysis_type = 'summary' } = args;

  try {
    // Read the file
    const fileContent = await fs.readFile(file_path, 'utf-8');
    const ext = path.extname(file_path).toLowerCase();

    let scheduleData;
    if (ext === '.xer') {
      scheduleData = parseXER(fileContent);
    } else if (ext === '.csv') {
      scheduleData = parseCSV(fileContent);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Supported formats: .xer, .csv`);
    }

    // Perform requested analysis
    let analysis;
    switch (analysis_type) {
      case 'summary':
        analysis = analyzeSummary(scheduleData);
        break;
      case 'trades':
        analysis = analyzeTrades(scheduleData);
        break;
      case 'timeline':
        analysis = analyzeTimeline(scheduleData);
        break;
      case 'dependencies':
        analysis = analyzeDependencies(scheduleData);
        break;
      case 'full':
        analysis = {
          summary: analyzeSummary(scheduleData),
          trades: analyzeTrades(scheduleData),
          timeline: analyzeTimeline(scheduleData),
          dependencies: analyzeDependencies(scheduleData),
        };
        break;
      default:
        throw new Error(`Unknown analysis type: ${analysis_type}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to analyze schedule: ${error.message}`);
  }
}

/**
 * Parse XER file format (Primavera P6)
 */
function parseXER(content) {
  const lines = content.split('\n');
  const tables = {};
  let currentTable = null;
  let headers = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('%T')) {
      // Table definition
      currentTable = trimmed.split('\t')[1];
      tables[currentTable] = [];
    } else if (trimmed.startsWith('%F')) {
      // Field headers
      headers = trimmed.split('\t').slice(1);
    } else if (trimmed.startsWith('%R')) {
      // Data row
      if (currentTable && headers.length > 0) {
        const values = trimmed.split('\t').slice(1);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        tables[currentTable].push(row);
      }
    }
  }

  return {
    format: 'xer',
    tables,
    activities: tables.TASK || [],
    wbs: tables.PROJWBS || [],
    dependencies: tables.TASKPRED || [],
    activityCodes: tables.ACTVCODE || [],
    activityTypes: tables.ACTVTYPE || [],
    taskActivityLinks: tables.TASKACTV || [],
  };
}

/**
 * Parse CSV file format
 */
function parseCSV(content) {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  return {
    format: 'csv',
    activities: result.data,
    headers: result.meta.fields || [],
  };
}

/**
 * Generate summary analysis
 */
function analyzeSummary(data) {
  const activities = data.activities || [];
  
  const summary = {
    total_activities: activities.length,
    file_format: data.format,
  };

  if (data.format === 'xer') {
    summary.wbs_items = data.wbs?.length || 0;
    summary.dependencies = data.dependencies?.length || 0;
    summary.activity_code_types = data.activityTypes?.length || 0;
    
    // Count status types
    const statusCounts = {};
    activities.forEach(act => {
      const status = act.status_code || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    summary.status_breakdown = statusCounts;
  }

  // Date range
  const dates = activities
    .map(a => [a.start_date || a.target_start_date, a.end_date || a.target_end_date])
    .flat()
    .filter(d => d)
    .map(d => new Date(d))
    .filter(d => !isNaN(d));

  if (dates.length > 0) {
    summary.date_range = {
      earliest: new Date(Math.min(...dates)).toISOString().split('T')[0],
      latest: new Date(Math.max(...dates)).toISOString().split('T')[0],
    };
  }

  return summary;
}

/**
 * Analyze by trade/activity codes
 */
function analyzeTrades(data) {
  const activities = data.activities || [];
  const tradeMap = {};

  if (data.format === 'xer' && data.activityCodes) {
    // Build activity code lookup
    const codeMap = {};
    data.activityCodes.forEach(code => {
      codeMap[code.actv_code_id] = code.short_name || code.actv_code_name;
    });

    // Link activities to codes
    const taskCodeMap = {};
    (data.taskActivityLinks || []).forEach(link => {
      if (!taskCodeMap[link.task_id]) {
        taskCodeMap[link.task_id] = [];
      }
      taskCodeMap[link.task_id].push(codeMap[link.actv_code_id] || 'Unknown');
    });

    // Count by trade
    activities.forEach(act => {
      const codes = taskCodeMap[act.task_id] || ['Unassigned'];
      codes.forEach(code => {
        if (!tradeMap[code]) {
          tradeMap[code] = { count: 0, activities: [] };
        }
        tradeMap[code].count++;
        if (tradeMap[code].activities.length < 5) {
          tradeMap[code].activities.push({
            id: act.task_code || act.task_id,
            name: act.task_name,
            duration: act.target_drtn_hr_cnt || act.remain_drtn_hr_cnt,
          });
        }
      });
    });
  } else {
    // For CSV, try to extract trade from columns
    activities.forEach(act => {
      const trade = act.trade || act.Trade || act.activity_code || 'Unassigned';
      if (!tradeMap[trade]) {
        tradeMap[trade] = { count: 0, activities: [] };
      }
      tradeMap[trade].count++;
      if (tradeMap[trade].activities.length < 5) {
        tradeMap[trade].activities.push({
          name: act.activity_name || act.Activity || act.task_name,
          duration: act.duration || act.Duration,
        });
      }
    });
  }

  return {
    trade_count: Object.keys(tradeMap).length,
    trades: tradeMap,
  };
}

/**
 * Analyze timeline/schedule
 */
function analyzeTimeline(data) {
  const activities = data.activities || [];
  
  // Extract dates and durations
  const timeline = activities.map(act => {
    const startDate = act.start_date || act.target_start_date || act.Start || '';
    const endDate = act.end_date || act.target_end_date || act.Finish || '';
    const duration = act.target_drtn_hr_cnt || act.remain_drtn_hr_cnt || act.Duration || 0;
    
    return {
      id: act.task_code || act.task_id || act.Activity_ID,
      name: act.task_name || act.Activity || '',
      start: startDate,
      end: endDate,
      duration_hours: duration,
      duration_days: duration ? Math.round(duration / 8) : 0,
    };
  }).filter(t => t.start || t.end);

  // Group by month
  const byMonth = {};
  timeline.forEach(item => {
    const date = new Date(item.start || item.end);
    if (!isNaN(date)) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(item);
    }
  });

  return {
    total_activities_with_dates: timeline.length,
    activities_by_month: Object.keys(byMonth).sort().reduce((acc, key) => {
      acc[key] = byMonth[key].length;
      return acc;
    }, {}),
    sample_activities: timeline.slice(0, 10),
  };
}

/**
 * Analyze dependencies
 */
function analyzeDependencies(data) {
  if (data.format !== 'xer' || !data.dependencies) {
    return {
      message: 'Dependency analysis only available for XER files',
      dependencies_found: false,
    };
  }

  const dependencies = data.dependencies;
  const depTypes = {};
  
  dependencies.forEach(dep => {
    const type = dep.pred_type || 'Unknown';
    depTypes[type] = (depTypes[type] || 0) + 1;
  });

  // Find critical path indicators (activities with most dependencies)
  const taskDepCount = {};
  dependencies.forEach(dep => {
    const taskId = dep.task_id;
    taskDepCount[taskId] = (taskDepCount[taskId] || 0) + 1;
  });

  const topDepTasks = Object.entries(taskDepCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([taskId, count]) => ({ task_id: taskId, dependency_count: count }));

  return {
    total_dependencies: dependencies.length,
    dependency_types: depTypes,
    tasks_with_most_dependencies: topDepTasks,
  };
}

