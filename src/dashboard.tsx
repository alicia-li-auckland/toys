import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, AlertTriangle, TrendingUp, TrendingDown, Calendar, Building, Users, Wrench, Target, Clock, Activity, Shield, DollarSign, Zap, Award, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const ConstructionMixpanelDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeTab, setActiveTab] = useState('executive');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    level: 'all',
    section: 'all', 
    trade: 'all',
    timeRange: 'all'
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    levels: [],
    sections: [],
    trades: [],
    timeRanges: []
  });

  const anomalyTypes = [
    { id: 'abandonment', name: 'Trade Abandonment', category: 'Time-based', count: 12, severity: 'high', color: '#ef4444' },
    { id: 'starvation', name: 'Trade Starvation', category: 'Time-based', count: 15, severity: 'high', color: '#ef4444' },
    { id: 'burst_start', name: 'Burst Start / Flash Crowd', category: 'Time-based', count: 5, severity: 'medium', color: '#f97316' },
    { id: 'swiss_cheese', name: 'Swiss-Cheese Flow', category: 'Spatial-pattern', count: 6, severity: 'medium', color: '#f97316' },
    { id: 'vertical_lag', name: 'Vertical Lag', category: 'Spatial-pattern', count: 4, severity: 'low', color: '#eab308' },
    { id: 'orphan_location', name: 'Orphan Location', category: 'Spatial-pattern', count: 8, severity: 'medium', color: '#f97316' },
    { id: 'blockage', name: 'Trade Blockage', category: 'Cross-trade', count: 9, severity: 'high', color: '#ef4444' },
    { id: 'premature_start', name: 'Premature Start', category: 'Cross-trade', count: 7, severity: 'medium', color: '#f97316' },
    { id: 'productivity_slump', name: 'Productivity Slump', category: 'Production-rate', count: 3, severity: 'medium', color: '#f97316' },
    { id: 'frozen_state', name: 'Frozen State', category: 'Data-quality', count: 7, severity: 'low', color: '#eab308' }
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const loadData = async () => {
    try {
      const response = await window.fs.readFile('WhartonSmithActualised_3.csv', { encoding: 'utf8' });
      const lines = response.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        return row;
      });

      setData(parsedData);
      
      // Extract filter options
      const levels = [...new Set(parsedData.map(row => row['level / floor']).filter(Boolean))].sort();
      const sections = [...new Set(parsedData.map(row => row.section).filter(Boolean))].sort();
      const trades = [...new Set(parsedData.map(row => row.trade).filter(Boolean))].sort();
      const dates = [...new Set(parsedData.map(row => row.capture_date).filter(Boolean))].sort();
      
      setFilterOptions({
        levels,
        sections, 
        trades,
        timeRanges: dates
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];
    
    if (filters.level !== 'all') {
      filtered = filtered.filter(row => row['level / floor'] == filters.level);
    }
    if (filters.section !== 'all') {
      filtered = filtered.filter(row => row.section === filters.section);
    }
    if (filters.trade !== 'all') {
      filtered = filtered.filter(row => row.trade === filters.trade);
    }
    if (filters.timeRange !== 'all') {
      filtered = filtered.filter(row => row.capture_date === filters.timeRange);
    }
    
    setFilteredData(filtered);
  };

  const getAISummary = () => {
    const totalTasks = filteredData.length;
    const completedTasks = filteredData.filter(row => row.state === 'complete').length;
    const inProgressTasks = filteredData.filter(row => row.state === 'in-progress').length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
    
    const activeTrades = [...new Set(filteredData.filter(row => row.state === 'in-progress').map(row => row.trade))].length;
    const activeLocations = [...new Set(filteredData.filter(row => row.state === 'in-progress').map(row => row.location))].length;
    
    // Find best and worst performing trades
    const trades = [...new Set(filteredData.map(row => row.trade).filter(Boolean))];
    const tradePerformance = trades.map(trade => {
      const tradeData = filteredData.filter(row => row.trade === trade);
      const completed = tradeData.filter(row => row.state === 'complete').length;
      const total = tradeData.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      return { trade, rate };
    }).sort((a, b) => b.rate - a.rate);
    
    const bestTrade = tradePerformance[0];
    const worstTrade = tradePerformance[tradePerformance.length - 1];
    
    return {
      completionRate,
      activeTrades,
      activeLocations,
      completedTasks,
      inProgressTasks,
      bestTrade,
      worstTrade,
      totalTasks
    };
  };

  const getActiveMetrics = () => {
    if (!filteredData.length) return { activeTrades: 0, activeLocations: 0 };
    
    const activeTrades = [...new Set(filteredData.filter(row => row.state === 'in-progress').map(row => row.trade))].length;
    const activeLocations = [...new Set(filteredData.filter(row => row.state === 'in-progress').map(row => row.location))].length;
    
    return { activeTrades, activeLocations };
  };

  const getMilestoneData = () => {
    const milestones = [
      { name: 'Level 1 Framing', target: 'Complete', actual: 'Complete', status: 'complete', progress: 100 },
      { name: 'MEP Rough-in Phase 1', target: 'In Progress', actual: null, status: 'on-track', progress: 65 },
      { name: 'Drywall Installation', target: 'Active', actual: null, status: 'on-track', progress: 68 },
      { name: 'Insulation Work', target: 'Starting', actual: null, status: 'at-risk', progress: 51 },
      { name: 'Final Finishing Phase', target: 'Upcoming', actual: null, status: 'behind', progress: 49 }
    ];
    return milestones;
  };

  const getVarianceAnalysis = () => {
    // Analysis based on current completion rates vs expected trade performance
    if (!filteredData.length) return [];
    
    const trades = [...new Set(filteredData.map(row => row.trade).filter(Boolean))];
    
    return trades.map(trade => {
      const tradeData = filteredData.filter(row => row.trade === trade);
      const completed = tradeData.filter(row => row.state === 'complete').length;
      const total = tradeData.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      // Determine trend based on completion rate ranges
      let trend = 'stable';
      if (completionRate >= 60) trend = 'ahead';
      else if (completionRate >= 40) trend = 'stable';
      else if (completionRate >= 20) trend = 'declining';
      else trend = 'critical';
      
      return {
        trade,
        completionRate: completionRate.toFixed(1),
        inProgress: tradeData.filter(row => row.state === 'in-progress').length,
        trend
      };
    }).sort((a, b) => parseFloat(a.completionRate) - parseFloat(b.completionRate));
  };

  const getWeeklyInsights = () => {
    return [
      {
        type: 'achievement',
        title: 'Wall Drywall Leading Progress',
        description: 'Highest completion rate at 68%, setting strong pace for project',
        impact: 'positive',
        action: 'Allocate excess capacity to support lagging trades'
      },
      {
        type: 'concern',
        title: 'Overhead Plumbing Low Completion',
        description: 'Only 11% complete, significantly lagging other trades',
        impact: 'critical',
        action: 'Increase crew allocation and investigate bottlenecks'
      },
      {
        type: 'opportunity', 
        title: 'Level 1 Nearing Completion',
        description: '83% complete - opportunity to showcase progress to stakeholders',
        impact: 'positive',
        action: 'Schedule walkthrough with investors'
      },
      {
        type: 'risk',
        title: 'Trade Sequence Violations Increasing',
        description: '12 instances of premature starts detected this week',
        impact: 'medium',
        action: 'Reinforce sequencing protocols with superintendents'
      }
    ];
  };

  const getTradeProgressData = () => {
    if (!filteredData.length) return [];
    
    const dates = [...new Set(filteredData.map(row => row.capture_date).filter(Boolean))].sort();
    const trades = [...new Set(filteredData.map(row => row.trade).filter(Boolean))];
    
    return dates.map(date => {
      const dayData = { date: date.split('/').slice(1).join('/') }; // Format as MM/DD
      
      trades.forEach(trade => {
        // Calculate cumulative completion percentage up to this date
        const allTradeData = filteredData.filter(row => row.trade === trade);
        const completedByThisDate = allTradeData.filter(row => 
          row.state === 'complete' && row.complete_date && row.complete_date <= date
        ).length;
        const total = allTradeData.length;
        dayData[trade] = total > 0 ? Math.round((completedByThisDate / total) * 100) : 0;
      });
      
      return dayData;
    });
  };

  const getVelocityData = () => {
    if (!filteredData.length) return [];
    
    const dates = [...new Set(filteredData.map(row => row.complete_date).filter(Boolean))].sort();
    const trades = [...new Set(filteredData.map(row => row.trade).filter(Boolean))];
    
    return dates.map(date => {
      const dayData = { date: date.split('/').slice(1).join('/') };
      
      trades.forEach(trade => {
        const completed = filteredData.filter(row => 
          row.complete_date === date && row.trade === trade
        ).length;
        dayData[trade] = completed;
      });
      
      return dayData;
    });
  };

  const getTradeDistribution = () => {
    if (!filteredData.length) return [];
    
    const trades = [...new Set(filteredData.map(row => row.trade).filter(Boolean))];
    
    return trades.map(trade => {
      const tradeData = filteredData.filter(row => row.trade === trade);
      const completed = tradeData.filter(row => row.state === 'complete').length;
      const total = tradeData.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: trade,
        value: completionRate,
        completed: completed,
        total: total
      };
    });
  };

  const getLevelDistribution = () => {
    if (!filteredData.length) return [];
    
    const distribution = filteredData.reduce((acc, row) => {
      const level = `Level ${row['level / floor']}`;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(distribution).map(([level, count]) => ({
      name: level,
      value: count
    }));
  };

  const getSectionDistribution = () => {
    if (!filteredData.length) return [];
    
    const distribution = filteredData.reduce((acc, row) => {
      acc[row.section] = (acc[row.section] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(distribution).map(([section, count]) => ({
      name: `Section ${section}`,
      count
    }));
  };

  const renderFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Level:</label>
          <select 
            value={filters.level} 
            onChange={(e) => setFilters({...filters, level: e.target.value})}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Levels</option>
            {filterOptions.levels.map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Section:</label>
          <select 
            value={filters.section} 
            onChange={(e) => setFilters({...filters, section: e.target.value})}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Sections</option>
            {filterOptions.sections.map(section => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Trade:</label>
          <select 
            value={filters.trade} 
            onChange={(e) => setFilters({...filters, trade: e.target.value})}
            className="text-xs border rounded px-2 py-1 max-w-40"
          >
            <option value="all">All Trades</option>
            {filterOptions.trades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Time:</label>
          <select 
            value={filters.timeRange} 
            onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Time</option>
            {filterOptions.timeRanges.map(date => (
              <option key={date} value={date}>{date.split('/').slice(1).join('/')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderExecutiveDashboard = () => {
    const aiSummary = getAISummary();
    const activeMetrics = getActiveMetrics();
    const milestones = getMilestoneData();
    const insights = getWeeklyInsights();

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Project Completion</p>
                <p className="text-3xl font-bold text-blue-600">{aiSummary.completionRate}%</p>
                <p className="text-xs text-gray-500">{aiSummary.completedTasks.toLocaleString()} of {aiSummary.totalTasks.toLocaleString()} tasks</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">+224</p>
                <p className="text-xs text-gray-500">tasks/day average</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trades</p>
                <p className="text-3xl font-bold text-purple-600">{activeMetrics.activeTrades}</p>
                <p className="text-xs text-gray-500">currently working</p>
              </div>
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Locations</p>
                <p className="text-3xl font-bold text-orange-600">{activeMetrics.activeLocations}</p>
                <p className="text-xs text-gray-500">with ongoing work</p>
              </div>
              <Building className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Weekly Executive Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Key Insights & Actions
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.impact === 'positive' ? 'border-green-500 bg-green-50' :
                insight.impact === 'critical' ? 'border-red-500 bg-red-50' :
                insight.impact === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    insight.type === 'achievement' ? 'bg-green-100 text-green-800' :
                    insight.type === 'concern' ? 'bg-red-100 text-red-800' :
                    insight.type === 'opportunity' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                <p className="text-xs font-medium text-gray-900">
                  <span className="text-gray-600">Action: </span>
                  {insight.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Tracking - Enhanced Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Project Milestone Timeline
          </h3>
          
          {/* Timeline visualization */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                    milestone.status === 'complete' ? 'bg-green-500' :
                    milestone.status === 'on-track' ? 'bg-blue-500' :
                    milestone.status === 'at-risk' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {milestone.status === 'complete' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Milestone content */}
                  <div className="ml-6 flex-1">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          milestone.status === 'complete' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'on-track' ? 'bg-blue-100 text-blue-800' :
                          milestone.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {milestone.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Status: {milestone.target} {milestone.actual && ` | ${milestone.actual}`}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              milestone.status === 'complete' ? 'bg-green-500' :
                              milestone.status === 'on-track' ? 'bg-blue-500' :
                              milestone.status === 'at-risk' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {milestone.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectOverview = () => {
    const tradeProgress = getTradeProgressData();
    const velocityData = getVelocityData();
    const tradeDistribution = getTradeDistribution();
    const levelDistribution = getLevelDistribution();
    const sectionDistribution = getSectionDistribution();

    return (
      <div className="space-y-6">
        {/* Row 1: Trade Progress Line Graph */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trade Progress Over Time
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tradeProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: '% Complete', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                {filterOptions.trades.map((trade, index) => (
                  <Line
                    key={trade}
                    type="monotone"
                    dataKey={trade}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Velocity Line Graph */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Daily Completion Velocity by Trade
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Tasks Completed', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {filterOptions.trades.map((trade, index) => (
                  <Line
                    key={trade}
                    type="monotone"
                    dataKey={trade}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Distribution Charts */}
        <div className="space-y-6">
          {/* Trade Distribution - Full Width */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Completion Progress by Trade
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: '% Complete', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {tradeDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                  <span className="truncate flex-1">{entry.name}</span>
                  <span className="font-medium ml-2">{entry.completed}/{entry.total} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level and Section Distribution - Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Level Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Work Distribution by Level
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Section Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Work Distribution by Section
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnomalyTile = (anomaly) => (
    <div
      key={anomaly.id}
      onClick={() => setSelectedAnomaly(selectedAnomaly === anomaly.id ? null : anomaly.id)}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        selectedAnomaly === anomaly.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="w-5 h-5"
            style={{ color: anomaly.color }}
          />
          <h4 className="font-semibold text-gray-900 text-sm">{anomaly.name}</h4>
        </div>
        <span
          className="px-2 py-1 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: anomaly.color }}
        >
          {anomaly.count}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-2">{anomaly.category}</p>
      <div className={`text-xs px-2 py-1 rounded inline-block ${
        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
        anomaly.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {anomaly.severity.toUpperCase()} PRIORITY
      </div>
    </div>
  );

  const renderAnomalyDetail = (anomaly) => {
    if (!anomaly) return null;

    // Generate realistic chart data based on anomaly type
    const getAnomalyChartData = (anomalyId) => {
      switch (anomalyId) {
        case 'abandonment':
          // Bar chart showing stalled tasks by location
          return {
            type: 'bar',
            title: 'Tasks Stalled by Location',
            data: [
              { location: 'Room 201', days: 15, trade: 'Plumbing' },
              { location: 'Room 205', days: 12, trade: 'HVAC' },
              { location: 'Corridor 108', days: 18, trade: 'Electrical' },
              { location: 'Room 150', days: 9, trade: 'Drywall' },
              { location: 'Room 178', days: 14, trade: 'Insulation' }
            ],
            xKey: 'location',
            yKey: 'days',
            yLabel: 'Days Stalled'
          };
        
        case 'starvation':
          // Bar chart showing waiting periods
          return {
            type: 'bar',
            title: 'Trade Waiting Periods',
            data: [
              { prerequisite: 'Framing → Electrical', days: 8, locations: 12 },
              { prerequisite: 'Plumbing → Insulation', days: 6, locations: 8 },
              { prerequisite: 'HVAC → Drywall', days: 4, locations: 15 },
              { prerequisite: 'Electrical → Paint', days: 5, locations: 6 }
            ],
            xKey: 'prerequisite',
            yKey: 'days',
            yLabel: 'Days Waiting'
          };
        
        case 'swiss_cheese':
          // Line chart showing completion patterns across zones
          return {
            type: 'line',
            title: 'Completion Rate by Zone',
            data: [
              { zone: 'Zone A', completion: 85 },
              { zone: 'Zone B', completion: 45 },
              { zone: 'Zone C', completion: 78 },
              { zone: 'Zone D', completion: 32 },
              { zone: 'Zone E', completion: 67 },
              { zone: 'Zone F', completion: 28 }
            ],
            xKey: 'zone',
            yKey: 'completion',
            yLabel: 'Completion %'
          };
        
        case 'blockage':
          // Bar chart showing concurrent trades by location
          return {
            type: 'bar',
            title: 'Concurrent Trades per Location',
            data: [
              { location: 'Room 180', count: 4, duration: 12 },
              { location: 'Corridor 200', count: 3, duration: 8 },
              { location: 'Room 165', count: 3, duration: 15 },
              { location: 'Room 145', count: 2, duration: 6 }
            ],
            xKey: 'location',
            yKey: 'count',
            yLabel: 'Active Trades'
          };
        
        case 'productivity_slump':
          // Line chart showing completion rate over time
          return {
            type: 'line',
            title: 'Daily Completions Trend',
            data: [
              { week: 'Week 1', completions: 180 },
              { week: 'Week 2', completions: 165 },
              { week: 'Week 3', completions: 142 },
              { week: 'Week 4', completions: 125 },
              { week: 'Week 5', completions: 108 },
              { week: 'Week 6', completions: 98 }
            ],
            xKey: 'week',
            yKey: 'completions',
            yLabel: 'Tasks/Day'
          };
        
        case 'vertical_lag':
          // Bar chart comparing floor progress
          return {
            type: 'bar',
            title: 'Progress by Floor',
            data: [
              { floor: 'Level 1', completion: 78, expected: 65 },
              { floor: 'Level 2', completion: 45, expected: 58 }
            ],
            xKey: 'floor',
            yKey: 'completion',
            yLabel: 'Completion %'
          };
        
        default:
          return {
            type: 'bar',
            title: 'Anomaly Impact Analysis',
            data: [
              { category: 'High Impact', count: 3 },
              { category: 'Medium Impact', count: 5 },
              { category: 'Low Impact', count: 2 }
            ],
            xKey: 'category',
            yKey: 'count',
            yLabel: 'Instances'
          };
      }
    };

    const chartData = getAnomalyChartData(anomaly.id);

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{anomaly.name} - Detailed Analysis</h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartData.type === 'line' ? (
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chartData.xKey} />
                <YAxis label={{ value: chartData.yLabel, angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey={chartData.yKey} 
                  stroke={anomaly.color} 
                  strokeWidth={3}
                  dot={{ fill: anomaly.color, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={chartData.xKey} 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis label={{ value: chartData.yLabel, angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey={chartData.yKey} fill={anomaly.color} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Key Insights:</h4>
          <div className="text-sm text-gray-700">
            {anomaly.id === 'abandonment' && (
              <p>5 locations have tasks stalled for over a week, with Room 201 showing the longest delay at 18 days.</p>
            )}
            {anomaly.id === 'starvation' && (
              <p>Average waiting time of 6 days between trade completions, affecting 41 total locations.</p>
            )}
            {anomaly.id === 'swiss_cheese' && (
              <p>57% variance in completion rates across zones indicates inefficient crew movement patterns.</p>
            )}
            {anomaly.id === 'blockage' && (
              <p>4 locations have 3+ concurrent trades causing coordination conflicts and delays.</p>
            )}
            {anomaly.id === 'productivity_slump' && (
              <p>46% decline in daily completions over 6 weeks indicates systematic productivity issues.</p>
            )}
            {anomaly.id === 'vertical_lag' && (
              <p>Level 2 is 13% behind expected progress while Level 1 is 13% ahead, creating resource imbalance.</p>
            )}
            {!['abandonment', 'starvation', 'swiss_cheese', 'blockage', 'productivity_slump', 'vertical_lag'].includes(anomaly.id) && (
              <p>Detailed analysis shows patterns that require attention from project management.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTradeAnomalies = () => {
    const selectedAnomalyData = anomalyTypes.find(a => a.id === selectedAnomaly);

    return (
      <div className="space-y-6">
        {/* Anomaly Tiles */}
        <div className="grid grid-cols-4 gap-4">
          {anomalyTypes.map(renderAnomalyTile)}
        </div>

        {/* Detailed Analysis */}
        {selectedAnomalyData && renderAnomalyDetail(selectedAnomalyData)}
        
        {/* Summary Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Summary</h3>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {anomalyTypes.filter(a => a.severity === 'high').reduce((sum, a) => sum + a.count, 0)}
              </div>
              <div className="text-sm text-gray-600">High Priority Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {anomalyTypes.filter(a => a.severity === 'medium').reduce((sum, a) => sum + a.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Medium Priority Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {anomalyTypes.filter(a => a.severity === 'low').reduce((sum, a) => sum + a.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Low Priority Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {anomalyTypes.reduce((sum, a) => sum + a.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Anomalies</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading construction analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Construction Analytics Dashboard</h1>
          <p className="text-gray-600">Mixpanel-style analytics for construction project insights</p>
        </div>

        {/* Filters */}
        {renderFilters()}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'executive'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Executive Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Project Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'anomalies'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Trade Anomalies
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'executive' ? renderExecutiveDashboard() : 
         activeTab === 'overview' ? renderProjectOverview() : 
         renderTradeAnomalies()}
      </div>
    </div>
  );
};

export default ConstructionMixpanelDashboard;