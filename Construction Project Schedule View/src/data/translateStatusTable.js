// Build scheduleData from a status snapshot table of the form:
// { table: { "YYYY/MM/DD": { [zoneId]: { [tradeName]: status } } } }
// status values expected: "not started" | "in progress" | "complete"

const toIsoDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDate = (s) => {
  // supports "YYYY/MM/DD" or "YYYY-MM-DD"
  const norm = s.replace(/\//g, '-');
  const [y, m, d] = norm.split('-').map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d));
};

const daysBetween = (a, b) => {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const normalizeStatus = (s) => {
  if (!s) return 'pending';
  const lower = String(s).toLowerCase();
  if (lower === 'complete' || lower === 'completed') return 'complete';
  if (lower === 'in progress' || lower === 'in-progress' || lower === 'progress') return 'inprogress';
  // treat anything else as not started
  return 'pending';
};

export function buildScheduleDataFromStatusTable(raw) {
  if (!raw || !raw.table || typeof raw.table !== 'object') {
    throw new Error('Invalid status table payload');
  }

  const dateKeys = Object.keys(raw.table).sort((a, b) => parseDate(a) - parseDate(b));
  if (dateKeys.length === 0) {
    throw new Error('Status table is empty');
  }

  const startDateObj = parseDate(dateKeys[0]);
  const endDateObj = parseDate(dateKeys[dateKeys.length - 1]);

  // collect all zone ids and trade names across dates
  const zoneIds = new Set();
  const tradesByZone = new Map(); // zoneId -> Set<trade>

  for (const dateKey of dateKeys) {
    const byZone = raw.table[dateKey] || {};
    for (const zid of Object.keys(byZone)) {
      zoneIds.add(zid);
      const tradeMap = byZone[zid] || {};
      const tradeSet = tradesByZone.get(zid) || new Set();
      for (const tradeName of Object.keys(tradeMap)) {
        const value = tradeMap[tradeName];
        if (typeof value === 'string') {
          tradeSet.add(tradeName);
        }
      }
      tradesByZone.set(zid, tradeSet);
    }
  }

  const locations = [
    {
      id: 'level-1',
      name: 'Site',
      type: 'level',
      children: [],
    },
  ];

  // helper to get status of a trade at a given date for a zone
  const getStatusAt = (dateKey, zid, trade) => {
    const byZone = raw.table[dateKey] || {};
    const tradeMap = byZone[zid] || {};
    const value = tradeMap[trade];
    return typeof value === 'string' ? value : undefined;
  };

  for (const zid of Array.from(zoneIds)) {
    const zoneName = `Zone ${String(zid).slice(0, 6)}`;
    const zoneNode = {
      id: `site-${zid}`,
      name: zoneName,
      type: 'zone',
      children: [],
    };

    const tradeSet = tradesByZone.get(zid) || new Set();
    for (const tradeName of Array.from(tradeSet)) {
      // derive earliest activity and completion dates
      let firstActiveDate = null; // first date with in progress or complete
      let firstCompleteDate = null; // first date with complete

      for (const d of dateKeys) {
        const st = normalizeStatus(getStatusAt(d, zid, tradeName));
        if (!firstActiveDate && (st === 'inprogress' || st === 'complete')) {
          firstActiveDate = parseDate(d);
        }
        if (!firstCompleteDate && st === 'complete') {
          firstCompleteDate = parseDate(d);
        }
      }

      const latestStatusRaw = getStatusAt(dateKeys[dateKeys.length - 1], zid, tradeName);
      const latestStatus = normalizeStatus(latestStatusRaw);

      const startDay = firstActiveDate
        ? daysBetween(startDateObj, firstActiveDate) + 1
        : daysBetween(startDateObj, endDateObj) + 1; // schedule after current if never started

      let durationDays;
      if (firstActiveDate && firstCompleteDate) {
        durationDays = Math.max(1, daysBetween(firstActiveDate, firstCompleteDate) + 1);
      } else if (firstActiveDate) {
        durationDays = Math.max(1, daysBetween(firstActiveDate, endDateObj) + 1);
      } else {
        durationDays = 1;
      }

      zoneNode.children.push({
        id: `site-${zid}-${tradeName.toLowerCase().replace(/\s+/g, '-')}`,
        name: tradeName,
        type: 'trade',
        status: latestStatus,
        startDay,
        duration: durationDays,
        contractor: '',
        notes: firstActiveDate
          ? `Active since ${toIsoDate(firstActiveDate)}; latest: ${latestStatusRaw || 'not started'}`
          : `Not started as of ${toIsoDate(endDateObj)}`,
      });
    }

    // sort trades by startDay then name for consistent display
    zoneNode.children.sort((a, b) => (a.startDay - b.startDay) || a.name.localeCompare(b.name));
    locations[0].children.push(zoneNode);
  }

  // sort zones by name
  locations[0].children.sort((a, b) => a.name.localeCompare(b.name));

  return {
    timeline: {
      startDate: toIsoDate(startDateObj),
      totalDays: Math.max(1, daysBetween(startDateObj, endDateObj) + 1),
      currentDate: toIsoDate(endDateObj),
    },
    locations,
  };
}


