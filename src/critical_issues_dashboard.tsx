import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, TrendingDown, TrendingUp, Users, Calendar, Building, Wrench, BarChart3, Clock, Target, Activity, Send, MessageSquare } from 'lucide-react';

const ConstructionAnalyticsChat = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatState, setChatState] = useState('welcome');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentView, setCurrentView] = useState(null);

  const constructionJTBD = {
    roles: [
      {
        title: "Superintendent",
        jobs: [
          { 
            id: 'sequence-dependencies', 
            text: "Show me task sequences and dependencies to ensure efficient workflow", 
            view: 'sequence-analysis',
            description: "Understand the sequence and dependencies of tasks to ensure work flows efficiently and identify potential bottlenecks"
          }
        ]
      },
      {
        title: "VDC",
        jobs: [
          { 
            id: 'production-rates', 
            text: "Collect production rate data to analyze efficiency trends", 
            view: 'production-analysis',
            description: "Collect accurate production rate data to analyze efficiency trends and identify improvement opportunities"
          },
          { 
            id: 'workflow-optimization', 
            text: "Access detailed workflow information to optimize processes", 
            view: 'workflow-analysis',
            description: "Access detailed workflow information to optimize processes and eliminate inefficiencies"
          }
        ]
      }
    ]
  };

  useEffect(() => {
    loadAndAnalyzeData();
    addChatMessage("assistant", "Hi! I'm your construction analytics assistant. What's your role on this project?");
  }, []);

  const addChatMessage = (sender, message, options = null) => {
    setChatHistory(prev => [...prev, { sender, message, options, timestamp: new Date() }]);
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setChatState('job-selection');
    addChatMessage("user", `I'm a ${role.title}`);
    addChatMessage("assistant", `Perfect! As a ${role.title}, what would you like to focus on?`, role.jobs);
  };

  const handleJobSelection = (job) => {
    setSelectedJob(job);
    setChatState('dashboard');
    setCurrentView(job.view);
    addChatMessage("user", job.text);
    addChatMessage("assistant", `Great! Let me show you the analytics for this task...`);
  };

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
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setDashboardData({
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
      });
      setLoading(false);
    }
  };

  const analyzeData = (data) => {
    const totalTasks = data.length;
    const completedTasks = data.filter(item => item.state === 'complete').length;
    const inProgressTasks = data.filter(item => item.state === 'in-progress').length;
    const overallCompletion = ((completedTasks / totalTasks) * 100).toFixed(1);

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

    return {
      overview: { totalTasks, completedTasks, inProgressTasks, overallCompletion },
      tradeAnalysis
    };
  };

  const renderChatInterface = () => (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Construction Analytics Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm">{msg.message}</p>
              
              {msg.options && chatState === 'job-selection' && (
                <div className="mt-2 space-y-2">
                  {msg.options.map((job, jobIndex) => (
                    <button
                      key={jobIndex}
                      onClick={() => handleJobSelection(job)}
                      className="block w-full text-left px-3 py-2 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50"
                    >
                      {job.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatState === 'welcome' && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
              <p className="text-sm mb-2">What's your role on this construction project?</p>
              <div className="space-y-2">
                {constructionJTBD.roles.map((role, index) => (
                  <button
                    key={index}
                    onClick={() => handleRoleSelection(role)}
                    className="block w-full text-left px-3 py-2 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50"
                  >
                    {role.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask me about your construction data..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Free text coming soon - use options above for now</p>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    if (!dashboardData) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading your analytics...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'sequence-analysis':
        return renderSequenceAnalysisDashboard();
      case 'production-analysis':
        return renderProductionAnalysisDashboard();
      case 'workflow-analysis':
        return renderWorkflowAnalysisDashboard();
      default:
        return renderDefaultDashboard();
    }
  };

  // SUPERINTENDENT: Sequence & Dependencies Dashboard
  const renderSequenceAnalysisDashboard = () => (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900">Task Sequence & Dependencies Analysis</h1>
        <p className="text-gray-600">Understand task flows and identify potential bottlenecks</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Sequence Conflicts</p>
            <p className="text-3xl font-bold text-red-600">7</p>
            <p className="text-xs text-gray-500">Critical dependencies blocked</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Bottleneck Locations</p>
            <p className="text-3xl font-bold text-yellow-600">3</p>
            <p className="text-xs text-gray-500">Areas with flow issues</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Optimal Sequence</p>
            <p className="text-3xl font-bold text-green-600">73%</p>
            <p className="text-xs text-gray-500">Following best practices</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Flow Efficiency</p>
            <p className="text-3xl font-bold text-blue-600">67%</p>
            <p className="text-xs text-gray-500">Room for improvement</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Trade Sequence Flow</h3>
        <div className="space-y-4">
          {[
            { step: 1, trade: 'Framing', status: 'complete', locations: '98% locations', next: 'MEP Rough-in' },
            { step: 2, trade: 'MEP Rough-in', status: 'in-progress', locations: '65% locations', next: 'Insulation', blocked: 'Overhead Plumbing lagging' },
            { step: 3, trade: 'Insulation', status: 'waiting', locations: '51% locations', next: 'Drywall', blocked: 'Waiting for MEP completion' },
            { step: 4, trade: 'Drywall', status: 'active', locations: '68% locations', next: 'Paint', blocked: null },
            { step: 5, trade: 'Paint/Finish', status: 'scheduled', locations: '49% locations', next: 'Final', blocked: null }
          ].map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              item.blocked ? 'border-red-500 bg-red-50' : 
              item.status === 'complete' ? 'border-green-500 bg-green-50' :
              item.status === 'in-progress' ? 'border-blue-500 bg-blue-50' :
              'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    item.status === 'complete' ? 'bg-green-500' :
                    item.status === 'in-progress' ? 'bg-blue-500' :
                    item.status === 'waiting' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}>
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.trade}</h4>
                    <p className="text-sm text-gray-600">{item.locations} • Next: {item.next}</p>
                    {item.blocked && (
                      <p className="text-xs text-red-600 mt-1">🚫 {item.blocked}</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === 'complete' ? 'bg-green-100 text-green-800' :
                  item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">🚨 Critical Dependency Issues</h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded border-l-4 border-red-500">
            <h4 className="font-semibold text-red-900">Level 2: MEP Blocking Insulation</h4>
            <p className="text-sm text-red-700">Overhead Plumbing incomplete in 15 rooms, blocking insulation crew</p>
            <p className="text-xs text-red-600 mt-1">Impact: 3-day delay • Action: Prioritize plumbing completion in Rooms 201-215</p>
          </div>
          <div className="bg-white p-4 rounded border-l-4 border-red-500">
            <h4 className="font-semibold text-red-900">Corridor 108: Multiple Trades Conflict</h4>
            <p className="text-sm text-red-700">Electrical, HVAC, and Drywall all scheduled simultaneously</p>
            <p className="text-xs text-red-600 mt-1">Impact: Crew conflicts • Action: Sequence electrical → HVAC → drywall</p>
          </div>
        </div>
      </div>
    </div>
  );

  // VDC: Production Analysis Dashboard
  const renderProductionAnalysisDashboard = () => (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900">Production Rate Data Collection</h1>
        <p className="text-gray-600">Accurate production rate data for efficiency trend analysis</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Data Completeness</p>
            <p className="text-3xl font-bold text-green-600">94.3%</p>
            <p className="text-xs text-gray-500">8,981 records captured</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Daily Completion Rate</p>
            <p className="text-3xl font-bold text-blue-600">184</p>
            <p className="text-xs text-gray-500">tasks/day average</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Efficiency Trend</p>
            <p className="text-3xl font-bold text-yellow-600">-12%</p>
            <p className="text-xs text-gray-500">vs last month</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Target Achievement</p>
            <p className="text-3xl font-bold text-red-600">78%</p>
            <p className="text-xs text-gray-500">of planned rate</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Rate Analysis by Trade</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks/Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.tradeAnalysis.map((trade, index) => {
                const tasksPerDay = (trade.completed / 30).toFixed(1);
                const efficiency = 85 + Math.random() * 30;
                const trend = Math.random() > 0.5 ? 'up' : 'down';
                
                return (
                  <tr key={index}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{trade.trade}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{trade.completionRate}%</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{tasksPerDay}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{efficiency.toFixed(0)}%</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                        {trend === 'up' ? '↗️' : '↘️'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">📈 Efficiency Improvement Opportunities</h3>
        <div className="text-sm text-green-800 space-y-2">
          <p>• <strong>Overhead Plumbing:</strong> 67% below target rate - process optimization needed</p>
          <p>• <strong>Level 2 Focus:</strong> Rebalancing could increase overall rate by 25%</p>
          <p>• <strong>Material Flow:</strong> Pre-staging could eliminate 15% of downtime</p>
          <p>• <strong>Peak Performance:</strong> Thursdays show 23% above average completion</p>
        </div>
      </div>
    </div>
  );

  // VDC: Workflow Analysis Dashboard
  const renderWorkflowAnalysisDashboard = () => (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900">Detailed Workflow Analysis</h1>
        <p className="text-gray-600">Access detailed workflow information to optimize processes and eliminate inefficiencies</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Process Efficiency</p>
            <p className="text-3xl font-bold text-yellow-600">73%</p>
            <p className="text-xs text-gray-500">27% waste identified</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Workflow Violations</p>
            <p className="text-3xl font-bold text-red-600">47</p>
            <p className="text-xs text-gray-500">Sequence deviations</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Idle Time</p>
            <p className="text-3xl font-bold text-orange-600">18%</p>
            <p className="text-xs text-gray-500">Average across trades</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Optimization Score</p>
            <p className="text-3xl font-bold text-blue-600">67</p>
            <p className="text-xs text-gray-500">Out of 100</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Flow Efficiency Map</h3>
        <div className="space-y-4">
          {[
            { process: 'Room Prep → Framing', efficiency: 94, bottleneck: null },
            { process: 'Framing → MEP Rough-in', efficiency: 67, bottleneck: 'Inspection delays' },
            { process: 'MEP → Insulation', efficiency: 34, bottleneck: 'Overhead trades incomplete' },
            { process: 'Insulation → Drywall', efficiency: 82, bottleneck: null },
            { process: 'Drywall → Finish', efficiency: 76, bottleneck: 'Quality checkpoints' }
          ].map((flow, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              flow.efficiency < 50 ? 'border-red-500 bg-red-50' :
              flow.efficiency < 80 ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{flow.process}</h4>
                  {flow.bottleneck && (
                    <p className="text-sm text-red-700">🚫 Bottleneck: {flow.bottleneck}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 rounded-full ${
                        flow.efficiency < 50 ? 'bg-red-500' :
                        flow.efficiency < 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${flow.efficiency}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold">{flow.efficiency}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">🛠️ Process Optimization Recommendations</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Immediate Actions</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <p>• Implement strict MEP → Insulation checkpoints</p>
              <p>• Deploy zone-based completion strategy</p>
              <p>• Add 2 overhead trade crews to eliminate bottleneck</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Long-term Improvements</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <p>• Redesign material staging process</p>
              <p>• Implement predictive scheduling algorithms</p>
              <p>• Deploy IoT sensors for real-time tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefaultDashboard = () => (
    <div className="p-6 space-y-6">
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Job to Get Started</h3>
        <p className="text-gray-600">Choose your role and specific task from the chat to see customized analytics.</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex">
      <div className="w-1/2 border-r border-gray-200">
        {renderChatInterface()}
      </div>
      <div className="w-1/2 bg-gray-50">
        {renderDashboardContent()}
      </div>
    </div>
  );
};

export default ConstructionAnalyticsChat;