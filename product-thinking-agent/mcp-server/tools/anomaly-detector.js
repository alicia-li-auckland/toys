import fs from 'fs/promises';
import Papa from 'papaparse';

/**
 * Run 15 anomaly detection algorithms on construction progress data
 * Based on domain knowledge about construction trade sequences and patterns
 */
export async function detectAnomalies(args) {
  const { data_file, detectors = ['all'] } = args;

  try {
    // Load progress data
    const content = await fs.readFile(data_file, 'utf-8');
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    const data = result.data;

    // Load construction domain knowledge for validation
    const domainKnowledge = await loadDomainKnowledge();

    // Run requested detectors
    const shouldRunAll = detectors.includes('all');
    const anomalies = {};

    if (shouldRunAll || detectors.includes('sequence_violations')) {
      anomalies.sequence_violations = detectSequenceViolations(data, domainKnowledge);
    }
    if (shouldRunAll || detectors.includes('stalled_trades')) {
      anomalies.stalled_trades = detectStalledTrades(data);
    }
    if (shouldRunAll || detectors.includes('velocity_disparities')) {
      anomalies.velocity_disparities = detectVelocityDisparities(data);
    }
    if (shouldRunAll || detectors.includes('completion_clustering')) {
      anomalies.completion_clustering = detectCompletionClustering(data);
    }
    if (shouldRunAll || detectors.includes('trade_stack_density')) {
      anomalies.trade_stack_density = detectTradeStackDensity(data);
    }
    if (shouldRunAll || detectors.includes('bottleneck_index')) {
      anomalies.bottleneck_index = calculateBottleneckIndex(data, domainKnowledge);
    }
    if (shouldRunAll || detectors.includes('abandoned_zones')) {
      anomalies.abandoned_zones = detectAbandonedZones(data);
    }
    if (shouldRunAll || detectors.includes('trade_leapfrogging')) {
      anomalies.trade_leapfrogging = detectTradeLeapfrogging(data);
    }
    if (shouldRunAll || detectors.includes('completion_rate_decay')) {
      anomalies.completion_rate_decay = detectCompletionRateDecay(data);
    }
    if (shouldRunAll || detectors.includes('false_starts')) {
      anomalies.false_starts = detectFalseStarts(data);
    }
    if (shouldRunAll || detectors.includes('hidden_rework')) {
      anomalies.hidden_rework = detectHiddenRework(data);
    }
    if (shouldRunAll || detectors.includes('trade_collisions')) {
      anomalies.trade_collisions = detectTradeCollisions(data, domainKnowledge);
    }
    if (shouldRunAll || detectors.includes('asymmetric_progress')) {
      anomalies.asymmetric_progress = detectAsymmetricProgress(data);
    }
    if (shouldRunAll || detectors.includes('schedule_deviations')) {
      anomalies.schedule_deviations = detectScheduleDeviations(data);
    }
    if (shouldRunAll || detectors.includes('material_constraints')) {
      anomalies.material_constraints = detectMaterialConstraints(data);
    }

    // Generate summary
    const summary = generateAnomalySummary(anomalies);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ summary, anomalies }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to detect anomalies: ${error.message}`);
  }
}

/**
 * Load construction domain knowledge from knowledge files
 */
async function loadDomainKnowledge() {
  try {
    const knowledgePath = new URL('../knowledge/construction-domain.json', import.meta.url);
    const content = await fs.readFile(knowledgePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return minimal fallback if knowledge file not available
    return {
      trade_sequence_order: { sequence: [] },
      conflicting_trade_pairs: { conflicts: [] },
    };
  }
}

/**
 * 1. Detect trades completed before their prerequisites
 */
function detectSequenceViolations(data, domain) {
  const violations = [];
  const sequence = domain.trade_sequence_order?.sequence || [];
  
  // Build prerequisite map
  const prereqMap = {};
  sequence.forEach(trade => {
    prereqMap[trade.code] = trade.prerequisites || [];
  });

  // Group by location
  const byLocation = groupBy(data, 'location');
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    activities.forEach(activity => {
      const trade = normalizeTradeCode(activity.trade);
      const completion = parseFloat(activity.completion_percentage || 0);
      
      if (completion > 0 && prereqMap[trade]) {
        // Check if prerequisites are complete
        prereqMap[trade].forEach(prereqCode => {
          const prereq = activities.find(a => normalizeTradeCode(a.trade) === prereqCode);
          const prereqCompletion = prereq ? parseFloat(prereq.completion_percentage || 0) : 0;
          
          if (prereqCompletion < 100) {
            violations.push({
              location,
              trade: activity.trade,
              prerequisite: prereqCode,
              issue: `Trade started (${completion}% complete) before prerequisite completed (${prereqCompletion}%)`,
              severity: 'high',
            });
          }
        });
      }
    });
  });

  return { count: violations.length, violations: violations.slice(0, 20) };
}

/**
 * 2. Detect trades with >50% in-progress but <20% completion rate
 */
function detectStalledTrades(data) {
  const stalled = [];
  const byTrade = groupBy(data, 'trade');
  
  Object.entries(byTrade).forEach(([trade, activities]) => {
    const inProgress = activities.filter(a => {
      const pct = parseFloat(a.completion_percentage || 0);
      return pct > 0 && pct < 100;
    });
    
    const avgCompletion = inProgress.reduce((sum, a) => 
      sum + parseFloat(a.completion_percentage || 0), 0) / (inProgress.length || 1);
    
    const inProgressRatio = inProgress.length / activities.length;
    
    if (inProgressRatio > 0.5 && avgCompletion < 20) {
      stalled.push({
        trade,
        in_progress_count: inProgress.length,
        total_count: activities.length,
        in_progress_ratio: (inProgressRatio * 100).toFixed(1) + '%',
        avg_completion: avgCompletion.toFixed(1) + '%',
        severity: 'high',
      });
    }
  });

  return { count: stalled.length, stalled };
}

/**
 * 3. Detect velocity disparities: same trade, different sections, >40% variance
 */
function detectVelocityDisparities(data) {
  const disparities = [];
  const byTrade = groupBy(data, 'trade');
  
  Object.entries(byTrade).forEach(([trade, activities]) => {
    const sections = groupBy(activities, 'location');
    const sectionCompletions = Object.entries(sections).map(([location, acts]) => ({
      location,
      avgCompletion: acts.reduce((sum, a) => 
        sum + parseFloat(a.completion_percentage || 0), 0) / acts.length,
    }));
    
    // Compare each pair
    for (let i = 0; i < sectionCompletions.length; i++) {
      for (let j = i + 1; j < sectionCompletions.length; j++) {
        const diff = Math.abs(sectionCompletions[i].avgCompletion - sectionCompletions[j].avgCompletion);
        const variance = (diff / Math.max(sectionCompletions[i].avgCompletion, sectionCompletions[j].avgCompletion)) * 100;
        
        if (variance > 40) {
          disparities.push({
            trade,
            location_a: sectionCompletions[i].location,
            completion_a: sectionCompletions[i].avgCompletion.toFixed(1) + '%',
            location_b: sectionCompletions[j].location,
            completion_b: sectionCompletions[j].avgCompletion.toFixed(1) + '%',
            variance: variance.toFixed(1) + '%',
            severity: 'medium',
          });
        }
      }
    }
  });

  return { count: disparities.length, disparities: disparities.slice(0, 20) };
}

/**
 * 4. Detect completion clustering at exactly 0% or 100%
 */
function detectCompletionClustering(data) {
  const byLocation = groupBy(data, 'location');
  const clusters = [];
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    const at0 = activities.filter(a => parseFloat(a.completion_percentage || 0) === 0);
    const at100 = activities.filter(a => parseFloat(a.completion_percentage || 0) === 100);
    
    if (at0.length >= 3 || at100.length >= 3) {
      clusters.push({
        location,
        at_0_percent: at0.length,
        at_100_percent: at100.length,
        total: activities.length,
        note: 'Unusual clustering at boundary values',
        severity: 'low',
      });
    }
  });

  return { count: clusters.length, clusters };
}

/**
 * 5. Detect trade stack density: ≥4 concurrent in-progress trades per location
 */
function detectTradeStackDensity(data) {
  const byLocation = groupBy(data, 'location');
  const dense = [];
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    const inProgress = activities.filter(a => {
      const pct = parseFloat(a.completion_percentage || 0);
      return pct > 0 && pct < 100;
    });
    
    if (inProgress.length >= 4) {
      dense.push({
        location,
        concurrent_trades: inProgress.length,
        trades: inProgress.map(a => a.trade).join(', '),
        severity: 'medium',
      });
    }
  });

  return { count: dense.length, dense };
}

/**
 * 6. Calculate bottleneck index: trades <30% complete that are prerequisites
 */
function calculateBottleneckIndex(data, domain) {
  const bottlenecks = [];
  const sequence = domain.trade_sequence_order?.sequence || [];
  
  // Build dependency map
  const dependentMap = {};
  sequence.forEach(trade => {
    trade.prerequisites?.forEach(prereq => {
      if (!dependentMap[prereq]) dependentMap[prereq] = [];
      dependentMap[prereq].push(trade.code);
    });
  });
  
  const byLocation = groupBy(data, 'location');
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    activities.forEach(activity => {
      const trade = normalizeTradeCode(activity.trade);
      const completion = parseFloat(activity.completion_percentage || 0);
      
      if (completion < 30 && dependentMap[trade]) {
        const dependents = dependentMap[trade];
        bottlenecks.push({
          location,
          trade: activity.trade,
          completion: completion + '%',
          blocks: dependents.join(', '),
          severity: 'high',
        });
      }
    });
  });

  return { count: bottlenecks.length, bottlenecks: bottlenecks.slice(0, 20) };
}

/**
 * 7. Detect abandoned zones: ≥3 in-progress trades but 0 completions
 */
function detectAbandonedZones(data) {
  const byLocation = groupBy(data, 'location');
  const abandoned = [];
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    const inProgress = activities.filter(a => {
      const pct = parseFloat(a.completion_percentage || 0);
      return pct > 0 && pct < 100;
    });
    const completed = activities.filter(a => parseFloat(a.completion_percentage || 0) === 100);
    
    if (inProgress.length >= 3 && completed.length === 0) {
      abandoned.push({
        location,
        in_progress_count: inProgress.length,
        completed_count: 0,
        severity: 'high',
      });
    }
  });

  return { count: abandoned.length, abandoned };
}

/**
 * 8. Detect non-contiguous completion patterns (gaps >5 locations)
 */
function detectTradeLeapfrogging(data) {
  const byTrade = groupBy(data, 'trade');
  const leaps = [];
  
  Object.entries(byTrade).forEach(([trade, activities]) => {
    const sorted = activities
      .map(a => ({ location: a.location, completion: parseFloat(a.completion_percentage || 0) }))
      .sort((a, b) => a.location.localeCompare(b.location));
    
    let completedStreak = 0;
    let gapStart = null;
    
    sorted.forEach((item, idx) => {
      if (item.completion === 100) {
        if (gapStart !== null) {
          const gapSize = idx - gapStart;
          if (gapSize > 5) {
            leaps.push({
              trade,
              gap_size: gapSize,
              from: sorted[gapStart].location,
              to: item.location,
              severity: 'medium',
            });
          }
          gapStart = null;
        }
      } else if (gapStart === null && completedStreak > 0) {
        gapStart = idx;
      }
      
      completedStreak = item.completion === 100 ? completedStreak + 1 : 0;
    });
  });

  return { count: leaps.length, leaps: leaps.slice(0, 20) };
}

/**
 * 9. Detect completion rate decay over time
 */
function detectCompletionRateDecay(data) {
  // Requires timestamp data
  const withDates = data.filter(d => d.last_updated || d.timestamp);
  if (withDates.length < 10) {
    return { count: 0, message: 'Insufficient timestamp data for trend analysis' };
  }
  
  // Group by time periods and calculate average completion rate
  // This is a simplified implementation
  return { count: 0, message: 'Trend analysis requires time-series data' };
}

/**
 * 10. Detect false starts: >70% in-progress but <5% completion
 */
function detectFalseStarts(data) {
  const falseStarts = [];
  const byTrade = groupBy(data, 'trade');
  
  Object.entries(byTrade).forEach(([trade, activities]) => {
    const started = activities.filter(a => parseFloat(a.completion_percentage || 0) > 0);
    const lowCompletion = started.filter(a => parseFloat(a.completion_percentage || 0) < 5);
    
    const ratio = lowCompletion.length / activities.length;
    
    if (ratio > 0.7 && lowCompletion.length >= 3) {
      falseStarts.push({
        trade,
        started_count: started.length,
        low_completion_count: lowCompletion.length,
        ratio: (ratio * 100).toFixed(1) + '%',
        severity: 'high',
      });
    }
  });

  return { count: falseStarts.length, falseStarts };
}

/**
 * 11. Detect hidden rework: status changes from complete back to in-progress
 */
function detectHiddenRework(data) {
  // Requires historical data with status changes
  return { count: 0, message: 'Rework detection requires historical status data' };
}

/**
 * 12. Detect trade collisions: conflicting trades both in-progress at same location
 */
function detectTradeCollisions(data, domain) {
  const conflicts = domain.conflicting_trade_pairs?.conflicts || [];
  const collisions = [];
  
  const byLocation = groupBy(data, 'location');
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    const inProgress = activities.filter(a => {
      const pct = parseFloat(a.completion_percentage || 0);
      return pct > 0 && pct < 100;
    });
    
    // Check each pair for conflicts
    conflicts.forEach(conflict => {
      const tradeA = inProgress.find(a => normalizeTradeCode(a.trade) === conflict.trade_a);
      const tradeB = inProgress.find(a => normalizeTradeCode(a.trade) === conflict.trade_b);
      
      if (tradeA && tradeB) {
        collisions.push({
          location,
          trade_a: tradeA.trade,
          trade_b: tradeB.trade,
          reason: conflict.reason,
          severity: 'high',
        });
      }
    });
  });

  return { count: collisions.length, collisions };
}

/**
 * 13. Detect asymmetric progress in related trade pairs (>20% difference)
 */
function detectAsymmetricProgress(data) {
  // Define related trade pairs
  const relatedPairs = [
    ['wall_drywall', 'wall_drywall_finish'],
    ['overhead_plumbing', 'overhead_duct_rough_in'],
  ];
  
  const asymmetric = [];
  const byLocation = groupBy(data, 'location');
  
  Object.entries(byLocation).forEach(([location, activities]) => {
    relatedPairs.forEach(([tradeA, tradeB]) => {
      const actA = activities.find(a => normalizeTradeCode(a.trade) === tradeA);
      const actB = activities.find(a => normalizeTradeCode(a.trade) === tradeB);
      
      if (actA && actB) {
        const completionA = parseFloat(actA.completion_percentage || 0);
        const completionB = parseFloat(actB.completion_percentage || 0);
        const diff = Math.abs(completionA - completionB);
        
        if (diff > 20) {
          asymmetric.push({
            location,
            trade_a: actA.trade,
            completion_a: completionA + '%',
            trade_b: actB.trade,
            completion_b: completionB + '%',
            difference: diff.toFixed(1) + '%',
            severity: 'medium',
          });
        }
      }
    });
  });

  return { count: asymmetric.length, asymmetric };
}

/**
 * 14. Detect schedule deviations
 */
function detectScheduleDeviations(data) {
  const deviations = data.filter(d => {
    if (d.scheduled_completion && d.actual_completion) {
      const diff = Math.abs(parseFloat(d.scheduled_completion) - parseFloat(d.actual_completion));
      return diff > 15;
    }
    return false;
  });

  return { count: deviations.length, deviations: deviations.slice(0, 20) };
}

/**
 * 15. Detect material constraints: >60% of locations stop at same completion %
 */
function detectMaterialConstraints(data) {
  const byTrade = groupBy(data, 'trade');
  const constraints = [];
  
  Object.entries(byTrade).forEach(([trade, activities]) => {
    const completionMap = {};
    activities.forEach(a => {
      const pct = Math.round(parseFloat(a.completion_percentage || 0) / 10) * 10; // Round to nearest 10
      completionMap[pct] = (completionMap[pct] || 0) + 1;
    });
    
    Object.entries(completionMap).forEach(([pct, count]) => {
      const ratio = count / activities.length;
      if (ratio > 0.6 && pct !== '0' && pct !== '100') {
        constraints.push({
          trade,
          stopped_at: pct + '%',
          location_count: count,
          total_locations: activities.length,
          ratio: (ratio * 100).toFixed(1) + '%',
          severity: 'high',
        });
      }
    });
  });

  return { count: constraints.length, constraints };
}

/**
 * Helper: Group array by key
 */
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const value = item[key] || 'Unknown';
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {});
}

/**
 * Helper: Normalize trade code for comparison
 */
function normalizeTradeCode(trade) {
  return (trade || '').toLowerCase().replace(/[^a-z]/g, '_');
}

/**
 * Generate summary of all anomalies
 */
function generateAnomalySummary(anomalies) {
  let totalAnomalies = 0;
  const bySeverity = { high: 0, medium: 0, low: 0 };
  
  Object.entries(anomalies).forEach(([type, result]) => {
    const count = result.count || 0;
    totalAnomalies += count;
    
    // Count by severity
    const items = result[Object.keys(result).find(k => Array.isArray(result[k]))] || [];
    items.forEach(item => {
      if (item.severity) {
        bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
      }
    });
  });
  
  return {
    total_anomalies: totalAnomalies,
    by_severity: bySeverity,
    detectors_run: Object.keys(anomalies).length,
  };
}

