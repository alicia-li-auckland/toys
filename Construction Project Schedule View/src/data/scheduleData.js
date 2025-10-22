// Construction Schedule Data
// Replace this with your real project data

import rawStatusTable from './rawStatusTable.json';
import { buildScheduleDataFromStatusTable } from './translateStatusTable';

export const scheduleData = buildScheduleDataFromStatusTable(rawStatusTable);

// Helper function to get all trades (for filtering)
export const getAllTrades = () => {
  const trades = new Set();
  
  const extractTrades = (items) => {
    items.forEach(item => {
      if (item.type === 'trade') {
        trades.add(item.name);
      }
      if (item.children) {
        extractTrades(item.children);
      }
    });
  };
  
  extractTrades(scheduleData.locations);
  return Array.from(trades);
};

// Helper function to get all contractors (for filtering)
export const getAllContractors = () => {
  const contractors = new Set();
  
  const extractContractors = (items) => {
    items.forEach(item => {
      if (item.type === 'trade' && item.contractor) {
        contractors.add(item.contractor);
      }
      if (item.children) {
        extractContractors(item.children);
      }
    });
  };
  
  extractContractors(scheduleData.locations);
  return Array.from(contractors);
};

// Helper function to get all levels (for filtering)
export const getAllLevels = () => {
  return scheduleData.locations
    .filter(item => item.type === 'level')
    .map(item => item.name);
};

// Status color mapping
export const statusColors = {
  complete: '#22c55e',    // Green
  inprogress: '#3b82f6',  // Blue  
  delayed: '#f97316',     // Orange
  pending: '#9ca3af'      // Gray
};