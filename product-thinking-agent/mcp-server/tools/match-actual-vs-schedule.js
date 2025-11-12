import fs from 'fs/promises';
import Papa from 'papaparse';
import natural from 'natural';
import { analyzeSchedule } from './analyze-schedule.js';

const { JaroWinklerDistance } = natural;

/**
 * Match actual construction progress data against scheduled activities
 * Supports multiple matching strategies
 */
export async function matchActualVsSchedule(args) {
  const {
    schedule_file,
    actual_file,
    matching_strategy = 'hybrid',
    confidence_threshold = 0.8,
  } = args;

  try {
    // Load schedule data
    const scheduleResult = await analyzeSchedule({
      file_path: schedule_file,
      analysis_type: 'full',
    });
    const scheduleAnalysis = JSON.parse(scheduleResult.content[0].text);
    
    // Load actual progress data
    const actualContent = await fs.readFile(actual_file, 'utf-8');
    const actualResult = Papa.parse(actualContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    const actualData = actualResult.data;

    // Perform matching based on strategy
    let matches;
    switch (matching_strategy) {
      case 'exact':
        matches = exactMatch(scheduleAnalysis, actualData);
        break;
      case 'fuzzy':
        matches = fuzzyMatch(scheduleAnalysis, actualData, confidence_threshold);
        break;
      case 'rule_based':
        matches = ruleBasedMatch(scheduleAnalysis, actualData);
        break;
      case 'hybrid':
        matches = hybridMatch(scheduleAnalysis, actualData, confidence_threshold);
        break;
      default:
        throw new Error(`Unknown matching strategy: ${matching_strategy}`);
    }

    // Generate summary statistics
    const summary = generateMatchSummary(matches, actualData.length);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary,
            matches: matches.slice(0, 100), // Limit output size
            total_matches: matches.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to match actual vs schedule: ${error.message}`);
  }
}

/**
 * Exact match by ID
 */
function exactMatch(scheduleAnalysis, actualData) {
  const matches = [];
  const scheduleActivities = getScheduleActivities(scheduleAnalysis);
  
  // Build ID lookup
  const scheduleMap = new Map();
  scheduleActivities.forEach(act => {
    const id = act.task_id || act.task_code || act.Activity_ID;
    if (id) scheduleMap.set(id.toString(), act);
  });

  actualData.forEach(actual => {
    const actualId = (actual.activity_id || actual.Activity_ID || actual.id || '').toString();
    const scheduled = scheduleMap.get(actualId);
    
    if (scheduled) {
      matches.push({
        actual,
        scheduled,
        match_type: 'exact_id',
        confidence: 1.0,
      });
    }
  });

  return matches;
}

/**
 * Fuzzy match by location and trade names
 */
function fuzzyMatch(scheduleAnalysis, actualData, threshold) {
  const matches = [];
  const scheduleActivities = getScheduleActivities(scheduleAnalysis);

  actualData.forEach(actual => {
    let bestMatch = null;
    let bestScore = 0;

    const actualLocation = normalize(actual.location || actual.Location || '');
    const actualTrade = normalize(actual.trade || actual.Trade || '');
    const actualName = normalize(actual.activity_name || actual.Activity || '');

    scheduleActivities.forEach(scheduled => {
      const schedLocation = normalize(
        scheduled.location || scheduled.Location || 
        scheduled.wbs_path || scheduled.WBS || ''
      );
      const schedTrade = normalize(
        scheduled.trade || scheduled.Trade || 
        scheduled.activity_code || ''
      );
      const schedName = normalize(scheduled.task_name || scheduled.Activity || '');

      // Calculate similarity scores
      const locationScore = actualLocation && schedLocation 
        ? JaroWinklerDistance(actualLocation, schedLocation) 
        : 0;
      const tradeScore = actualTrade && schedTrade 
        ? JaroWinklerDistance(actualTrade, schedTrade) 
        : 0;
      const nameScore = actualName && schedName 
        ? JaroWinklerDistance(actualName, schedName) 
        : 0;

      // Weighted average (location and trade are most important)
      const compositeScore = (locationScore * 0.4 + tradeScore * 0.4 + nameScore * 0.2);

      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestMatch = scheduled;
      }
    });

    if (bestMatch && bestScore >= threshold) {
      matches.push({
        actual,
        scheduled: bestMatch,
        match_type: 'fuzzy',
        confidence: bestScore,
      });
    }
  });

  return matches;
}

/**
 * Rule-based match using known patterns
 */
function ruleBasedMatch(scheduleAnalysis, actualData) {
  const matches = [];
  const scheduleActivities = getScheduleActivities(scheduleAnalysis);

  // Define trade mapping rules
  const tradeRules = {
    'SOG': ['concrete', 'slab', 'foundation'],
    'MEP': ['mechanical', 'electrical', 'plumbing'],
    'HVAC': ['hvac', 'duct', 'ventilation'],
    'Drywall': ['drywall', 'gwb', 'gypsum'],
  };

  actualData.forEach(actual => {
    const actualLocation = normalize(actual.location || actual.Location || '');
    const actualTrade = normalize(actual.trade || actual.Trade || '');

    // Try to find matching scheduled activity
    const matched = scheduleActivities.find(scheduled => {
      const schedLocation = normalize(scheduled.location || scheduled.wbs_path || '');
      const schedTrade = normalize(scheduled.trade || scheduled.activity_code || '');
      const schedName = normalize(scheduled.task_name || scheduled.Activity || '');

      // Check if location matches
      const locationMatch = actualLocation && schedLocation && 
        (schedLocation.includes(actualLocation) || actualLocation.includes(schedLocation));

      // Check if trade matches via rules
      let tradeMatch = actualTrade && schedTrade && 
        (schedTrade.includes(actualTrade) || actualTrade.includes(schedTrade));
      
      if (!tradeMatch) {
        // Try rule-based matching
        for (const [abbrev, keywords] of Object.entries(tradeRules)) {
          if (actualTrade.includes(abbrev.toLowerCase())) {
            tradeMatch = keywords.some(kw => schedName.includes(kw) || schedTrade.includes(kw));
            if (tradeMatch) break;
          }
        }
      }

      return locationMatch && tradeMatch;
    });

    if (matched) {
      matches.push({
        actual,
        scheduled: matched,
        match_type: 'rule_based',
        confidence: 0.9,
      });
    }
  });

  return matches;
}

/**
 * Hybrid two-pass matching: exact/rule-based first, then fuzzy
 */
function hybridMatch(scheduleAnalysis, actualData, threshold) {
  const matches = [];
  const unmatchedActual = [];

  // Pass 1: Try exact match
  const exactMatches = exactMatch(scheduleAnalysis, actualData);
  const exactMatchedIds = new Set(exactMatches.map(m => getActualId(m.actual)));
  matches.push(...exactMatches);

  // Collect unmatched items
  actualData.forEach(actual => {
    if (!exactMatchedIds.has(getActualId(actual))) {
      unmatchedActual.push(actual);
    }
  });

  // Pass 2: Try rule-based for remaining
  const ruleMatches = ruleBasedMatch(scheduleAnalysis, unmatchedActual);
  const ruleMatchedIds = new Set(ruleMatches.map(m => getActualId(m.actual)));
  matches.push(...ruleMatches);

  // Collect still-unmatched items
  const stillUnmatched = unmatchedActual.filter(actual => 
    !ruleMatchedIds.has(getActualId(actual))
  );

  // Pass 3: Fuzzy match for remaining
  const fuzzyMatches = fuzzyMatch(scheduleAnalysis, stillUnmatched, threshold);
  matches.push(...fuzzyMatches);

  return matches;
}

/**
 * Helper: Get schedule activities from analysis result
 */
function getScheduleActivities(scheduleAnalysis) {
  // Handle different analysis structures
  if (scheduleAnalysis.summary) {
    // Full analysis - need to reconstruct from original data
    // For now, return empty array as we'd need to re-parse
    return [];
  }
  return scheduleAnalysis.activities || [];
}

/**
 * Helper: Normalize string for comparison
 */
function normalize(str) {
  return str.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Helper: Get unique ID for actual data item
 */
function getActualId(actual) {
  return actual.id || actual.Activity_ID || 
    `${actual.location}_${actual.trade}_${actual.activity_name}`;
}

/**
 * Generate match summary statistics
 */
function generateMatchSummary(matches, totalActual) {
  const byType = {};
  const byConfidence = { high: 0, medium: 0, low: 0 };

  matches.forEach(match => {
    byType[match.match_type] = (byType[match.match_type] || 0) + 1;
    
    if (match.confidence >= 0.9) byConfidence.high++;
    else if (match.confidence >= 0.7) byConfidence.medium++;
    else byConfidence.low++;
  });

  return {
    total_actual_records: totalActual,
    total_matched: matches.length,
    total_unmatched: totalActual - matches.length,
    match_rate: ((matches.length / totalActual) * 100).toFixed(1) + '%',
    matches_by_type: byType,
    matches_by_confidence: byConfidence,
  };
}

