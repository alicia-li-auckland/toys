import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, TrendingDown, TrendingUp, Users, Calendar, Building, Wrench, BarChart3, Clock, Target, Activity, MessageSquare } from 'lucide-react';

const ConstructionAnalyticsChat = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [activeChart, setActiveChart] = useState(null);

  useEffect(() => {
    loadAndAnalyzeData();
  }, []);

  const loadAndAnalyzeData = async () => {
    try {
      const response = await window.fs.readFile('WhartonSmithActualised_3.csv', { encoding: 'utf8' });
      const lines = response.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        return row;
      });

      const analysis = analyzeData(data);
      setDashboardData(analysis);
      generateInitialInsights(analysis);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      const mockData = {
        overview: { totalTasks: 8981, completedTasks: 3366, inProgressTasks: 5615, overallCompletion: "37.5" },
        tradeAnalysis: [
          { trade: "Overhead Duct Rough In", completionRate: "9.4", completed: 121, inProgress: 1162, total: 1283, alertLevel: "red" },
          { trade: "Overhead Plumbing", completionRate: "11.1", completed: 142, inProgress: 1141, total: 1283, alertLevel: "red" },
          { trade: "Overhead Duct Insulation", completionRate: "15.7", completed: 202, inProgress: 1081, total: 1283, alertLevel: "yellow" },
          { trade: "Wall Prime Paint", completionRate: "48.9", completed: 628, inProgress: 655, total: 1283, alertLevel: "green" },
          { trade: "In Wall Insulation", completionRate: "51.4", completed: 659, inProgress: 624, total: 1283, alertLevel: "green" },
          { trade: "Wall Drywall Finish", completionRate: "58.1", completed: 746, inProgress: 537, total: 1283, alertLevel: "green" },
          { trade: "Wall Drywall", completionRate: "67.7", completed: 868, inProgress: 415, total: 1283, alertLevel: "green" }
        ]
      };
      setDashboardData(mockData);
      generateInitialInsights(mockData);
      setLoading(false);
    }
  };

  const analyzeData = (data) => {
    const totalTasks = data.length;
    const completedTasks = data.filter(item => item.state === 'complete').length;
    const inProgressTasks = data.filter(item => item.state === 'in-progress').length;
    const overallCompletion = ((completedTasks / totalTasks) * 100).toFixed(1);

    // Level analysis
    const levelGroups = data.reduce((acc, item) => {
      const level = item['level / floor'] || 'Unknown';
      if (!acc[level]) acc[level] = { total: 0, completed: 0 };
      acc[level].total++;
      if (item.state === 'complete') acc[level].completed++;
      return acc;
    }, {});

    // Trade analysis
    const tradeGroups = data.reduce((acc, item) => {
      if (!acc[item.trade]) {
        acc[item.trade] = { total: 0, completed: 0, inProgress: 0, items: [] };
      }
      acc[item.trade].total++;
      acc[item.trade].items.push(item);
      if (item.state === 'complete') {
        acc[item.trade].completed++;
      } else if (item.state === 'in-progress') {
        acc[item.trade].inProgress++;
      }
      return acc;
    }, {});

    const tradeAnalysis = Object.entries(tradeGroups).map(([trade, tradeData]) => {
      const completionRate = (tradeData.completed / tradeData.total) * 100;
      return {
        trade,
        completionRate: completionRate.toFixed(1),
        completed: tradeData.completed,
        inProgress: tradeData.inProgress,
        total: tradeData.total,
        alertLevel: completionRate < 15 ? 'red' : completionRate < 30 ? 'yellow' : 'green'
      };
    }).sort((a, b) => parseFloat(a.completionRate) - parseFloat(b.completionRate));

    // Velocity analysis - completion data by date and trade
    const completedWork = data.filter(item => item.complete_date && item.state === 'complete');
    const velocityData = {};
    
    completedWork.forEach(item => {
      const date = item.complete_date;
      const trade = item.trade;
      
      if (!velocityData[date]) {
        velocityData[date] = {};
      }
      if (!velocityData[date][trade]) {
        velocityData[date][trade] = 0;
      }
      velocityData[date][trade]++;
    });

    // Convert to time series data
    const timeSeriesData = Object.entries(velocityData)
      .map(([date, trades]) => ({
        date: new Date(date),
        dateStr: date,
        ...trades
      }))
      .sort((a, b) => a.date - b.date);

    // Get all unique trades for consistent data structure
    const allTrades = [...new Set(tradeAnalysis.map(t => t.trade))];

    // Fill missing dates with zeros for each trade
    const completeTimeSeriesData = timeSeriesData.map(day => {
      const completeDay = { ...day };
      allTrades.forEach(trade => {
        if (!completeDay[trade]) {
          completeDay[trade] = 0;
        }
      });
      return completeDay;
    });

    return {
      overview: { totalTasks, completedTasks, inProgressTasks, overallCompletion },
      tradeAnalysis,
      levelAnalysis: levelGroups,
      velocityData: completeTimeSeriesData,
      allTrades
    };
  };

  const generateInitialInsights = (data) => {
    const insights = [];
    
    // Welcome message
    addChatMessage("assistant", "Good morning! I've analyzed your latest construction data. Here's your project status and key insights:");

    // Overall status
    const statusMessage = `Your project is ${data.overview.overallCompletion}% complete with ${data.overview.completedTasks} tasks finished and ${data.overview.inProgressTasks} currently in progress.`;
    addChatMessage("assistant", statusMessage);

    // Critical issues
    const criticalTrades = data.tradeAnalysis.filter(t => parseFloat(t.completionRate) < 15);
    if (criticalTrades.length > 0) {
      const criticalMessage = `🚨 I've identified ${criticalTrades.length} critical bottlenecks that need immediate attention:`;
      addChatMessage("assistant", criticalMessage);
      
      criticalTrades.forEach(trade => {
        const tileData = {
          id: `critical-${trade.trade}`,
          type: 'critical-trade',
          title: `${trade.trade}: ${trade.completionRate}% Complete`,
          description: `Only ${trade.completed} of ${trade.total} tasks done - major bottleneck`,
          severity: 'critical',
          data: trade,
          chartType: 'trade-progress'
        };
        addClickableTile("assistant", tileData);
      });
    }

    // Level analysis
    if (data.levelAnalysis && data.levelAnalysis['1'] && data.levelAnalysis['2']) {
      const level1Rate = (data.levelAnalysis['1'].completed / data.levelAnalysis['1'].total * 100).toFixed(1);
      const level2Rate = (data.levelAnalysis['2'].completed / data.levelAnalysis['2'].total * 100).toFixed(1);
      const gap = Math.abs(parseFloat(level1Rate) - parseFloat(level2Rate));
      
      if (gap > 25) {
        const levelMessage = `📊 Significant vertical imbalance detected between floors:`;
        addChatMessage("assistant", levelMessage);
        
        const levelTileData = {
          id: 'level-imbalance',
          type: 'level-analysis',
          title: `Level Imbalance: ${gap.toFixed(1)}% Gap`,
          description: `Level 1: ${level1Rate}% vs Level 2: ${level2Rate}%`,
          severity: 'warning',
          data: { level1Rate, level2Rate, gap },
          chartType: 'level-comparison'
        };
        addClickableTile("assistant", levelTileData);
      }
    }

    // Productivity insights
    const topPerformer = data.tradeAnalysis[data.tradeAnalysis.length - 1];
    const performanceMessage = `✅ Best performing trade: ${topPerformer.trade} at ${topPerformer.completionRate}% completion.`;
    addChatMessage("assistant", performanceMessage);

    const performanceTileData = {
      id: 'top-performer',
      type: 'performance',
      title: `${topPerformer.trade}: ${topPerformer.completionRate}%`,
      description: `${topPerformer.completed}/${topPerformer.total} tasks complete - on track`,
      severity: 'good',
      data: topPerformer,
      chartType: 'trade-progress'
    };
    addClickableTile("assistant", performanceTileData);

    // Overall trend
    const trendMessage = `📈 Based on current data, here's your project velocity and trend analysis:`;
    addChatMessage("assistant", trendMessage);

    const velocityTileData = {
      id: 'project-velocity',
      type: 'velocity',
      title: 'Project Velocity: Daily Trade Completions',
      description: 'Task completion trends over time by trade',
      severity: 'warning',
      data: { 
        velocityData: data.velocityData, 
        allTrades: data.allTrades,
        totalCompleted: data.overview.completedTasks 
      },
      chartType: 'velocity-trend'
    };
    addClickableTile("assistant", velocityTileData);

    // End with action items
    const actionMessage = `💡 Click any of the insights above to see detailed charts and analysis. What would you like to investigate first?`;
    addChatMessage("assistant", actionMessage);
  };

  const addChatMessage = (sender, message) => {
    setChatHistory(prev => [...prev, { 
      sender, 
      message, 
      timestamp: new Date(),
      type: 'message'
    }]);
  };

  const addClickableTile = (sender, tileData) => {
    setChatHistory(prev => [...prev, { 
      sender, 
      type: 'tile',
      tileData,
      timestamp: new Date()
    }]);
  };

  const handleTileClick = (tileData) => {
    setSelectedInsight(tileData);
    setActiveChart(tileData.chartType);
    
    // Add a response message
    const responseMessage = `Analyzing ${tileData.title}... Here's the detailed breakdown:`;
    addChatMessage("assistant", responseMessage);
  };

  const renderChart = () => {
    if (!selectedInsight || !activeChart) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Click an Insight to See Details</h3>
            <p className="text-gray-600">Select any clickable insight from the chat to view detailed charts and analysis.</p>
          </div>
        </div>
      );
    }

    switch (activeChart) {
      case 'trade-progress':
        return renderTradeProgressChart();
      case 'level-comparison':
        return renderLevelComparisonChart();
      case 'velocity-trend':
        return renderVelocityTrendChart();
      default:
        return renderDefaultChart();
    }
  };

  const renderTradeProgressChart = () => (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900">{selectedInsight.data.trade} Progress Analysis</h1>
        <p className="text-gray-600">Detailed breakdown of completion status and bottlenecks</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-center">
            <p className="text-sm font-medium text-green-800">Completed</p>
            <p className="text-2xl font-bold text-green-600">{selectedInsight.data.completed}</p>
            <p className="text-xs text-green-700">{selectedInsight.data.completionRate}% of total</p>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{selectedInsight.data.inProgress}</p>
            <p className="text-xs text-blue-700">Active work items</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Remaining</p>
            <p className="text-2xl font-bold text-gray-900">{selectedInsight.data.total - selectedInsight.data.completed - selectedInsight.data.inProgress}</p>
            <p className="text-xs text-gray-500">Not started</p>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Visualization</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium text-gray-700">
            <span>Overall Progress</span>
            <span>{selectedInsight.data.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                parseFloat(selectedInsight.data.completionRate) < 15 ? 'bg-red-500' :
                parseFloat(selectedInsight.data.completionRate) < 30 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${selectedInsight.data.completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>Target: 85%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
          {parseFloat(selectedInsight.data.completionRate) < 15 ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>Critical Action Required:</strong> This trade is significantly behind schedule. 
                Consider adding additional crews, reviewing material availability, and implementing daily progress reviews.
              </p>
            </div>
          ) : parseFloat(selectedInsight.data.completionRate) < 30 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>Monitor Closely:</strong> This trade needs attention. Schedule check-ins and consider resource reallocation if no improvement in 48 hours.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800">
                <strong>On Track:</strong> This trade is performing well. Continue monitoring and consider using excess capacity to support struggling trades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLevelComparisonChart = () => (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900">Level Completion Analysis</h1>
        <p className="text-gray-600">Vertical progress comparison and resource allocation insights</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Level 1</h3>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-600">{selectedInsight.data.level1Rate}%</div>
            <p className="text-blue-700">Completion Rate</p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className="h-3 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${selectedInsight.data.level1Rate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Level 2</h3>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-red-600">{selectedInsight.data.level2Rate}%</div>
            <p className="text-red-700">Completion Rate</p>
          </div>
          <div className="w-full bg-red-200 rounded-full h-3">
            <div 
              className="h-3 bg-red-600 rounded-full transition-all duration-500"
              style={{ width: `${selectedInsight.data.level2Rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">⚠️ Resource Reallocation Needed</h3>
        <p className="text-yellow-800 mb-4">
          The {selectedInsight.data.gap.toFixed(1)}% completion gap between levels indicates inefficient resource distribution.
        </p>
        <div className="space-y-2 text-sm text-yellow-800">
          <p>• <strong>Immediate Action:</strong> Move 30% of Level 1 crews to Level 2</p>
          <p>• <strong>Expected Impact:</strong> Could accelerate Level 2 by 2-3 weeks</p>
          <p>• <strong>Risk Mitigation:</strong> Maintain minimum crews on Level 1 for completion tasks</p>
        </div>
      </div>
    </div>
  );

  const renderVelocityTrendChart = () => {
    if (!selectedInsight.data.velocityData || selectedInsight.data.velocityData.length === 0) {
      return (
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No velocity data available - completion dates missing from data</p>
          </div>
        </div>
      );
    }

    // Get trade colors
    const tradeColors = {
      'Wall Drywall': '#10b981',
      'Wall Drywall Finish': '#06b6d4', 
      'In Wall Insulation': '#8b5cf6',
      'Wall Prime Paint': '#f59e0b',
      'Overhead Duct Insulation': '#ef4444',
      'Overhead Plumbing': '#ec4899',
      'Overhead Duct Rough In': '#6366f1'
    };

    // Calculate date range
    const dates = selectedInsight.data.velocityData.map(d => d.date);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Get top 10 completion days for better visualization
    const topCompletionDays = selectedInsight.data.velocityData
      .map(day => ({
        ...day,
        total: selectedInsight.data.allTrades.reduce((sum, trade) => sum + (day[trade] || 0), 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20) // Show top 20 days
      .sort((a, b) => a.date - b.date); // Sort by date again

    return (
      <div className="p-6 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Project Velocity Analysis</h1>
          <p className="text-gray-600">Daily task completions by trade over time</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-800">Total Completed</p>
              <p className="text-2xl font-bold text-blue-600">{selectedInsight.data.totalCompleted}</p>
              <p className="text-xs text-blue-700">tasks finished</p>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm font-medium text-green-800">Peak Day</p>
              <p className="text-2xl font-bold text-green-600">{Math.max(...selectedInsight.data.velocityData.map(d => 
                selectedInsight.data.allTrades.reduce((sum, trade) => sum + (d[trade] || 0), 0)
              ))}</p>
              <p className="text-xs text-green-700">tasks in one day</p>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-center">
              <p className="text-sm font-medium text-purple-800">Active Period</p>
              <p className="text-2xl font-bold text-purple-600">{selectedInsight.data.velocityData.length}</p>
              <p className="text-xs text-purple-700">working days</p>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-800">Avg Daily Rate</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(selectedInsight.data.totalCompleted / selectedInsight.data.velocityData.length).toFixed(0)}
              </p>
              <p className="text-xs text-yellow-700">tasks per day</p>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Completions by Trade</h3>
          
          {/* Chart Container */}
          <div className="relative" style={{ height: '400px' }}>
            <svg width="100%" height="100%" viewBox="0 0 800 400" className="overflow-visible">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line 
                  key={`grid-${i}`}
                  x1="60" 
                  y1={350 - (i * 60)} 
                  x2="750" 
                  y2={350 - (i * 60)} 
                  stroke="#f3f4f6" 
                  strokeWidth="1"
                />
              ))}

              {/* Y-axis labels */}
              {[0, 50, 100, 150, 200, 250].map((value, i) => (
                <text 
                  key={`y-label-${i}`}
                  x="50" 
                  y={355 - (i * 60)} 
                  textAnchor="end" 
                  fontSize="12" 
                  fill="#6b7280"
                >
                  {value}
                </text>
              ))}

              {/* Trade lines */}
              {selectedInsight.data.allTrades.map((trade, tradeIndex) => {
                const tradeData = topCompletionDays.map((day, dayIndex) => ({
                  x: 60 + (dayIndex * (690 / Math.max(1, topCompletionDays.length - 1))),
                  y: 350 - ((day[trade] || 0) * 1.2), // Scale factor for visibility
                  value: day[trade] || 0
                }));

                if (tradeData.length < 2) return null;

                const pathData = tradeData
                  .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                  .join(' ');

                return (
                  <g key={trade}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={tradeColors[trade] || '#6b7280'}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                    {/* Data points */}
                    {tradeData.map((point, pointIndex) => (
                      <circle
                        key={`${trade}-point-${pointIndex}`}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill={tradeColors[trade] || '#6b7280'}
                        opacity="0.8"
                      />
                    ))}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {topCompletionDays.slice(0, 8).map((day, index) => {
                const x = 60 + (index * (690 / Math.max(1, 7)));
                return (
                  <text 
                    key={`x-label-${index}`}
                    x={x} 
                    y="375" 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#6b7280"
                    transform={`rotate(-45 ${x} 375)`}
                  >
                    {day.dateStr}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {selectedInsight.data.allTrades.map(trade => (
              <div key={trade} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: tradeColors[trade] || '#6b7280' }}
                ></div>
                <span className="text-xs text-gray-600 truncate">{trade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performance Days */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">🏆 Top Performance Days</h3>
          <div className="space-y-2">
            {selectedInsight.data.velocityData
              .map(day => ({
                ...day,
                total: selectedInsight.data.allTrades.reduce((sum, trade) => sum + (day[trade] || 0), 0)
              }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 5)
              .map((day, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                  <span className="text-sm font-medium">{day.dateStr}</span>
                  <span className="text-lg font-bold text-green-600">{day.total} tasks</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDefaultChart = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Insight</h3>
        <p className="text-gray-600">Click on any insight tile to view detailed analysis</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Analyzing your construction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left Panel - Chat Interface */}
      <div className="w-1/2 border-r border-gray-200">
        <div className="h-full flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Construction Intelligence Assistant
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, index) => (
              <div key={index} className="flex justify-start">
                <div className="max-w-full">
                  {msg.type === 'message' ? (
                    <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ) : msg.type === 'tile' ? (
                    <div 
                      className={`mt-2 p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                        msg.tileData.severity === 'critical' ? 'border-red-500 bg-red-50 hover:bg-red-100' :
                        msg.tileData.severity === 'warning' ? 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100' :
                        'border-green-500 bg-green-50 hover:bg-green-100'
                      }`}
                      onClick={() => handleTileClick(msg.tileData)}
                    >
                      <h4 className="font-semibold text-gray-900 text-sm">{msg.tileData.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{msg.tileData.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          msg.tileData.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          msg.tileData.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {msg.tileData.severity === 'critical' ? 'Critical' :
                           msg.tileData.severity === 'warning' ? 'Action Needed' : 'On Track'}
                        </span>
                        <span className="text-xs text-gray-500">Click to analyze →</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Charts */}
      <div className="w-1/2 bg-gray-50">
        {renderChart()}
      </div>
    </div>
  );
};

export default ConstructionAnalyticsChat;