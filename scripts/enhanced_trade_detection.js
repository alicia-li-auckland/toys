// Enhanced Trade Detection System
// Uses Activity ID, Name, and WBS/Trade Area code for comprehensive trade prediction

// Enhanced trade detection with multiple data sources
function detectTradeFromActivityEnhanced(activityId, activityName, wbsCode) {
  const combinedText = `${activityId || ''} ${activityName || ''} ${wbsCode || ''}`.toLowerCase();
  
  // Enhanced trade keywords with more patterns and variations
  const enhancedTradeKeywords = {
    // Structural trades
    structural_piles: {
      keywords: ['pile', 'piling', 'caisson', 'foundation', 'deep foundation', 'driven pile', 'bored pile', 'pier'],
      wbs_patterns: ['str', 'struct', 'foundation', 'pile', 'found'],
      id_patterns: ['pil', 'found', 'str']
    },
    structural_steel: {
      keywords: ['steel', 'beam', 'column', 'frame', 'erection', 'welding', 'structural steel', 'steel frame'],
      wbs_patterns: ['steel', 'str', 'struct', 'frame', 'erect'],
      id_patterns: ['stl', 'steel', 'str', 'beam', 'col']
    },
    
    // Concrete trades
    concrete_formwork: {
      keywords: ['formwork', 'form', 'shoring', 'falsework', 'scaffolding', 'concrete formwork', 'timber form'],
      wbs_patterns: ['form', 'concrete', 'conc', 'shore'],
      id_patterns: ['form', 'conc', 'shor']
    },
    concrete_rebar: {
      keywords: ['rebar', 'reinforc', 'steel reinforc', 'reinforcing', 'bar', 'concrete rebar', 'reinforcement'],
      wbs_patterns: ['rebar', 'reinf', 'concrete', 'conc', 'bar'],
      id_patterns: ['reb', 'reinf', 'bar', 'conc']
    },
    concrete_pour: {
      keywords: ['pour', 'concrete pour', 'placement', 'concrete placement', 'slab', 'footing', 'concrete slab'],
      wbs_patterns: ['pour', 'concrete', 'conc', 'slab', 'place'],
      id_patterns: ['pour', 'conc', 'slab', 'plc']
    },
    
    // Electrical trades
    electrical_conduit: {
      keywords: ['electrical yard equipment conduit', 'conduit', 'electrical conduit', 'cable tray', 'raceway'],
      wbs_patterns: ['elec', 'electrical', 'conduit', 'cable', 'eyd'],
      id_patterns: ['elec', 'cond', 'eyd', 'cab']
    },
    electrical_placement: {
      keywords: ['electrical yard equipment placement', 'electrical equipment', 'electrical placement', 'switchgear', 'panel'],
      wbs_patterns: ['elec', 'electrical', 'equipment', 'eyd', 'switch'],
      id_patterns: ['elec', 'equip', 'eyd', 'swgr']
    },
    
    // Mechanical trades
    mechanical_placement: {
      keywords: ['mechanical yard equipment placement', 'mechanical equipment', 'mechanical placement', 'hvac', 'pump'],
      wbs_patterns: ['mech', 'mechanical', 'equipment', 'myd', 'hvac'],
      id_patterns: ['mech', 'equip', 'myd', 'hvac']
    },
    booster_pump_system: {
      keywords: ['booster pump', 'pump system', 'booster pump system installation', 'water pump', 'fire pump'],
      wbs_patterns: ['pump', 'booster', 'water', 'fire'],
      id_patterns: ['pump', 'bst', 'wat', 'fire']
    },
    
    // Water treatment
    dwtr_installation: {
      keywords: ['dwtr', 'dwtr installation', 'water treatment', 'domestic water', 'potable water'],
      wbs_patterns: ['dwtr', 'water', 'treatment', 'domestic', 'potable'],
      id_patterns: ['dwtr', 'wat', 'treat', 'dom']
    },
    mwt_installation: {
      keywords: ['mwt', 'mwt installation', 'makeup water', 'process water', 'industrial water'],
      wbs_patterns: ['mwt', 'makeup', 'process', 'industrial', 'water'],
      id_patterns: ['mwt', 'mkup', 'proc', 'ind']
    },
    
    // Roofing trades
    roofing_metal_deck: {
      keywords: ['roofing metal deck', 'metal deck', 'roof deck', 'steel deck', 'composite deck'],
      wbs_patterns: ['roof', 'deck', 'metal', 'steel'],
      id_patterns: ['roof', 'deck', 'mtl', 'stl']
    },
    roofing_insulation: {
      keywords: ['roofing insulation', 'insulation', 'roof insulation', 'thermal insulation'],
      wbs_patterns: ['roof', 'insul', 'thermal'],
      id_patterns: ['roof', 'ins', 'therm']
    },
    roofing_membrane: {
      keywords: ['roofing membrane', 'membrane', 'roof membrane', 'waterproof', 'epdm', 'tpo'],
      wbs_patterns: ['roof', 'membrane', 'waterproof', 'epdm'],
      id_patterns: ['roof', 'memb', 'wp', 'epdm']
    },
    roofing_flashing: {
      keywords: ['roofing flashing', 'flashing', 'roof flashing', 'edge flashing', 'base flashing'],
      wbs_patterns: ['roof', 'flash', 'edge', 'base'],
      id_patterns: ['roof', 'flash', 'edge']
    },
    
    // Site work
    backfill: {
      keywords: ['backfill', 'fill', 'earth', 'soil', 'excavation', 'grading', 'earthwork'],
      wbs_patterns: ['backfill', 'fill', 'earth', 'excavation', 'grade'],
      id_patterns: ['fill', 'exc', 'earth', 'grade']
    },
    
    // Specialized equipment
    conveyance: {
      keywords: ['conveyance', 'conveyor', 'material handling', 'belt conveyor', 'screw conveyor'],
      wbs_patterns: ['convey', 'conveyor', 'material', 'belt'],
      id_patterns: ['conv', 'belt', 'mat', 'hand']
    },
    generator_placement: {
      keywords: ['generator placement', 'generator', 'gen', 'backup power', 'emergency power'],
      wbs_patterns: ['generator', 'gen', 'power', 'backup', 'emergency'],
      id_patterns: ['gen', 'pow', 'back', 'emerg']
    }
  };

  // Scoring system for better accuracy
  const scores = {};
  
  for (const [tradeKey, tradeData] of Object.entries(enhancedTradeKeywords)) {
    let score = 0;
    
    // Check keywords in combined text (weight: 3)
    for (const keyword of tradeData.keywords) {
      if (combinedText.includes(keyword)) {
        score += 3;
        break; // Only count once per category
      }
    }
    
    // Check WBS patterns (weight: 2)
    if (wbsCode) {
      const wbsLower = wbsCode.toLowerCase();
      for (const pattern of tradeData.wbs_patterns) {
        if (wbsLower.includes(pattern)) {
          score += 2;
          break;
        }
      }
    }
    
    // Check Activity ID patterns (weight: 1)
    if (activityId) {
      const idLower = activityId.toLowerCase();
      for (const pattern of tradeData.id_patterns) {
        if (idLower.includes(pattern)) {
          score += 1;
          break;
        }
      }
    }
    
    if (score > 0) {
      scores[tradeKey] = score;
    }
  }
  
  // Return the trade with the highest score, or null if no matches
  if (Object.keys(scores).length === 0) return null;
  
  const bestTrade = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  return bestTrade;
}

// Enhanced trade name mapping with confidence indicators
function getTradeNameEnhanced(tradeCode, confidence = 'medium') {
  const tradeNameMap = {
    'backfill': 'Backfill & Earthwork',
    'booster_pump_system': 'Booster Pump System Installation',
    'concrete_formwork': 'Concrete Formwork',
    'concrete_pour': 'Concrete Pour & Placement',
    'concrete_rebar': 'Concrete Reinforcement',
    'conveyance': 'Conveyance Systems',
    'dwtr_installation': 'Domestic Water Treatment',
    'electrical_conduit': 'Electrical Conduit & Raceways',
    'electrical_placement': 'Electrical Equipment Installation',
    'generator_placement': 'Generator Installation',
    'mwt_installation': 'Makeup Water Treatment',
    'mechanical_placement': 'Mechanical Equipment Installation',
    'roofing_flashing': 'Roofing Flashing',
    'roofing_insulation': 'Roofing Insulation',
    'roofing_membrane': 'Roofing Membrane',
    'roofing_metal_deck': 'Metal Roof Decking',
    'structural_piles': 'Structural Piles & Foundations',
    'structural_steel': 'Structural Steel Erection'
  };
  
  const baseName = tradeNameMap[tradeCode] || tradeCode;
  
  // Add confidence indicator if requested
  if (confidence === 'high') return `${baseName} ✓`;
  if (confidence === 'low') return `${baseName} ?`;
  return baseName;
}

// Context-aware location extraction
function extractLocationEnhanced(activityId, activityName, wbsCode) {
  const combinedText = `${activityId || ''} ${activityName || ''} ${wbsCode || ''}`.toLowerCase();
  
  // Enhanced location patterns with priorities
  const locationPatterns = {
    'DCH': {
      patterns: ['dch', 'data center hall', 'data centre hall'],
      priority: 3
    },
    'EYD': {
      patterns: ['eyd', 'electrical yard', 'elect yard'],
      priority: 3
    },
    'MYD': {
      patterns: ['myd', 'mechanical yard', 'mech yard', 'myd1', 'myd2', 'myd3', 'myd4'],
      priority: 3
    },
    'USS YARD': {
      patterns: ['uss', 'utility support structure', 'uss yard'],
      priority: 3
    },
    'GEN YARD': {
      patterns: ['gen yard', 'generator yard', 'gen pad', 'generator pad'],
      priority: 3
    },
    'DWTR': {
      patterns: ['dwtr', 'domestic water', 'potable water'],
      priority: 2
    },
    'Fire Pump House': {
      patterns: ['fire pump', 'pump house', 'fire protection'],
      priority: 2
    },
    'GPS': {
      patterns: ['gps', 'general plant services'],
      priority: 2
    },
    'SSS': {
      patterns: ['sss', 'site support services'],
      priority: 2
    },
    'MCP': {
      patterns: ['mcp', 'main control panel', 'control panel'],
      priority: 2
    },
    'Loading Dock': {
      patterns: ['loading dock', 'loading bay', 'dock', 'receiving'],
      priority: 2
    },
    'Conveyance': {
      patterns: ['conveyance', 'conveyor', 'material handling'],
      priority: 2
    }
  };
  
  let bestMatch = { location: '', priority: 0 };
  
  for (const [locationCode, data] of Object.entries(locationPatterns)) {
    for (const pattern of data.patterns) {
      if (combinedText.includes(pattern)) {
        if (data.priority > bestMatch.priority) {
          bestMatch = { location: locationCode, priority: data.priority };
        }
      }
    }
  }
  
  return bestMatch.location;
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectTradeFromActivityEnhanced,
    getTradeNameEnhanced,
    extractLocationEnhanced
  };
}



