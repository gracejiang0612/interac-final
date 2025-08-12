// Working Mom Fullscreen Timeline Data
// Groups consecutive time periods with the same activity

// If a global `timelineData` (from complete_timeline_data.js) exists, convert it to the
// internal 15-minute-grid format; otherwise fall back to the embedded default data.

function tryBuildRawDataFromCompleteDataset() {
    if (typeof timelineData === 'undefined' || !Array.isArray(timelineData) || timelineData.length < 2) {
        return null;
    }

    // Helper to map activity to category heuristically
    const categorize = (activity) => {
        const a = (activity || '').toLowerCase();
        if (/(work|meeting|office|commute|travel to)/.test(a)) return 'Work';
        if (/(son|kid|child|school|band|practice|pick up)/.test(a)) return 'Kid';
        return 'Self';
    };

    // Convert timestamps into 15-min slots between 4:00 and 24:00
    const startOfDay = new Date(2023, 0, 30, 4, 0, 0).getTime(); // arbitrary base 4:00 AM
    const endOfDay = new Date(2023, 0, 31, 0, 0, 0).getTime(); // midnight

    const withKid = timelineData.find(d => /with\s*kid/i.test(d.label) || /with\s*children/i.test(d.label));
    const withoutKid = timelineData.find(d => /without\s*kid/i.test(d.label) || /without\s*children/i.test(d.label));
    if (!withKid || !withoutKid) return null;

    // Build a map from time (ms) to activity text for each scenario
    function buildSlots(source) {
        const slots = new Map();
        source.times.forEach(t => {
            const s = Math.max(t.starting_time, startOfDay);
            const e = Math.min(t.ending_time, endOfDay);
            for (let ms = s; ms < e; ms += 15 * 60 * 1000) {
                slots.set(ms, t.activity);
            }
        });
        return slots;
    }

    const wSlots = buildSlots(withKid);
    const woSlots = buildSlots(withoutKid);

    const result = [];
    for (let ms = startOfDay; ms < endOfDay; ms += 15 * 60 * 1000) {
        const date = new Date(ms);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        const wAct = wSlots.get(ms) || '—';
        const woAct = woSlots.get(ms) || '—';
        result.push({
            time: timeStr,
            withKid: wAct,
            withKidCategory: categorize(wAct),
            withoutKid: woAct,
            withoutKidCategory: categorize(woAct)
        });
    }

    return result;
}

const defaultRawData = [
    {time: "4:00", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "4:15", withKid: "Alarm goes off", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "4:30", withKid: "Get up, brush teeth, fix hair, get dressed, start coffee maker", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "4:45", withKid: "Leave for gym", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "5:00", withKid: "Work out", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "5:15", withKid: "Work out", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "5:30", withKid: "Work out", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "5:45", withKid: "Work out", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "6:00", withKid: "Work out", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "6:15", withKid: "Arrive at home. Have a cup of coffee, check work e-mails and calendar for the day", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "6:30", withKid: "Shower and begin getting ready", withKidCategory: "Self", withoutKid: "Wake up and go to gym", withoutKidCategory: "Self"},
    {time: "6:45", withKid: "Shower and begin getting ready", withKidCategory: "Self", withoutKid: "Gym workout", withoutKidCategory: "Self"},
    {time: "7:00", withKid: "Wake up son", withKidCategory: "Kid", withoutKid: "Gym workout", withoutKidCategory: "Self"},
    {time: "7:15", withKid: "Wake up son", withKidCategory: "Kid", withoutKid: "Gym workout", withoutKidCategory: "Self"},
    {time: "7:30", withKid: "Wake up son", withKidCategory: "Kid", withoutKid: "Gym workout", withoutKidCategory: "Self"},
    {time: "7:45", withKid: "Take son to school", withKidCategory: "Kid", withoutKid: "Shower and get ready", withoutKidCategory: "Self"},
    {time: "8:00", withKid: "Take son to school", withKidCategory: "Kid", withoutKid: "Get ready for work", withoutKidCategory: "Self"},
    {time: "8:15", withKid: "Head to work event", withKidCategory: "Work", withoutKid: "Travel to work", withoutKidCategory: "Work"},
    {time: "8:30", withKid: "Work event", withKidCategory: "Work", withoutKid: "Work event", withoutKidCategory: "Work"},
    {time: "8:45", withKid: "Work event", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "9:00", withKid: "Work event", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "9:15", withKid: "Work event", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "9:30", withKid: "Work event", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "9:45", withKid: "Work event", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "10:00", withKid: "Take virtual meeting in car while parked at the office", withKidCategory: "Work", withoutKid: "Virtual meeting", withoutKidCategory: "Work"},
    {time: "10:15", withKid: "Take virtual meeting in car while parked at the office", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "10:30", withKid: "Take virtual meeting in car while parked at the office", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "10:45", withKid: "Take virtual meeting in car while parked at the office", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "11:00", withKid: "Commute to 11:30 meeting", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "11:15", withKid: "Commute to 11:30 meeting", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "11:30", withKid: "Off site meeting", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "11:45", withKid: "Off site meeting", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "12:00", withKid: "Off site meeting", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "12:15", withKid: "Off site meeting", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "12:30", withKid: "Get home, start laundry, make lunch and eat", withKidCategory: "Self", withoutKid: "No dinner prep needed", withoutKidCategory: "Self"},
    {time: "12:45", withKid: "Get home, start laundry, make lunch and eat", withKidCategory: "Self", withoutKid: "Continue work day", withoutKidCategory: "Work"},
    {time: "13:00", withKid: "Get home, start laundry, make lunch and eat", withKidCategory: "Self", withoutKid: "Office work", withoutKidCategory: "Work"},
    {time: "13:15", withKid: "Get home, start laundry, make lunch and eat", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "13:30", withKid: "Catch up on e-mails, return work phone calls", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "13:45", withKid: "Catch up on e-mails, return work phone calls", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "14:00", withKid: "Catch up on e-mails, return work phone calls", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "14:15", withKid: "Catch up on e-mails, return work phone calls", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "14:30", withKid: "Catch up on e-mails, return work phone calls", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "14:45", withKid: "Catch up on e-mails, return work phone calls", withKidCategory: "Work", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "15:00", withKid: "Pick up son from school", withKidCategory: "Kid", withoutKid: "Negotiations meeting", withoutKidCategory: "Work"},
    {time: "15:15", withKid: "Pick up son from school", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "15:30", withKid: "Start on dinner, make sure son is doing homework and practicing instrument", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "15:45", withKid: "Start on dinner, make sure son is doing homework and practicing instrument", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "16:00", withKid: "Start on dinner, make sure son is doing homework and practicing instrument", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "16:15", withKid: "Start on dinner, make sure son is doing homework and practicing instrument", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "16:30", withKid: "Start on dinner, make sure son is doing homework and practicing instrument", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "16:45", withKid: "Serve, eat, clean up dinner", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "17:00", withKid: "Serve, eat, clean up dinner", withKidCategory: "Kid", withoutKid: "Travel to school board meeting", withoutKidCategory: "Work"},
    {time: "17:15", withKid: "Serve, eat, clean up dinner", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "17:30", withKid: "Take 30 minutes to herself", withKidCategory: "Self", withoutKid: "School board meeting", withoutKidCategory: "Work"},
    {time: "17:45", withKid: "Take 30 minutes to herself", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "18:00", withKid: "Take son to band practice and drum lessons", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "18:15", withKid: "Take son to band practice and drum lessons", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "18:30", withKid: "Grocery shop at Costco, Aldi, and Cub Foods", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "18:45", withKid: "Grocery shop at Costco, Aldi, and Cub Foods", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "19:00", withKid: "Grocery shop at Costco, Aldi, and Cub Foods", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "19:15", withKid: "Grocery shop at Costco, Aldi, and Cub Foods", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "19:30", withKid: "Grocery shop at Costco, Aldi, and Cub Foods", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "19:45", withKid: "Grocery shop at Costco, Aldi, and Cub Foods", withKidCategory: "Self", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "20:00", withKid: "Pick up son", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "20:15", withKid: "Pick up son", withKidCategory: "Kid", withoutKid: "Work", withoutKidCategory: "Work"},
    {time: "20:30", withKid: "Unload groceries, wash and portion out fruit", withKidCategory: "Self", withoutKid: "Return home - relaxation time", withoutKidCategory: "Self"},
    {time: "20:45", withKid: "Make sure son is in the shower and getting ready for bed", withKidCategory: "Kid", withoutKid: "Leisure time - much more relaxed", withoutKidCategory: "Self"},
    {time: "21:00", withKid: "Make sure son is in the shower and getting ready for bed", withKidCategory: "Kid", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "21:15", withKid: "After saying good night to son, wash face and get ready for bed myself", withKidCategory: "Kid", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "21:30", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "21:45", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "22:00", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time - No homework checking, no bedtime routine", withoutKidCategory: "Self"},
    {time: "22:15", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "22:30", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "22:45", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "23:00", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Leisure time", withoutKidCategory: "Self"},
    {time: "23:15", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Probably go to sleep at 10, 11, maybe even midnight", withoutKidCategory: "Self"},
    {time: "23:30", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"},
    {time: "23:45", withKid: "Sleep", withKidCategory: "Self", withoutKid: "Sleep", withoutKidCategory: "Self"}
];

let rawData = tryBuildRawDataFromCompleteDataset() || null;

// Function to group consecutive time periods with same activity and category
function groupConsecutiveActivities(data) {
    const groups = [];
    let currentGroup = null;
    
    data.forEach((item, index) => {
        // Group activities that are the same for BOTH with and without kids scenarios
        const shouldStartNewGroup = !currentGroup || 
            currentGroup.withKidActivity !== item.withKid || 
            currentGroup.withKidCategory !== item.withKidCategory;
            
        if (shouldStartNewGroup) {
            if (currentGroup) {
                groups.push(currentGroup);
            }
            
            currentGroup = {
                startTime: item.time,
                endTime: item.time,
                startIndex: index,
                endIndex: index,
                withKidActivity: item.withKid,
                withKidCategory: item.withKidCategory,
                withoutKidActivity: item.withoutKid,
                withoutKidCategory: item.withoutKidCategory,
                duration: 1,
                timeBlocks: [item]
            };
        } else {
            currentGroup.endTime = item.time;
            currentGroup.endIndex = index;
            currentGroup.duration++;
            currentGroup.timeBlocks.push(item);
            
            // Update without kid activity if it changes within the same group
            if (currentGroup.withoutKidActivity !== item.withoutKid && 
                !currentGroup.withoutKidActivity.includes(item.withoutKid)) {
                currentGroup.withoutKidActivity += ` → ${item.withoutKid}`;
            }
        }
    });
    
    if (currentGroup) {
        groups.push(currentGroup);
    }
    
    return groups;
}

// Helper to (re)compute all derived globals and notify listeners
function computeAndPublish(raw) {
    // Filter data to end at 12:00 AM (midnight) - use all data
    window.filteredRawData = raw;
    console.log(`Data rows loaded: ${raw.length}`);
    
    // Group the data
    window.activityGroups = groupConsecutiveActivities(window.filteredRawData);
    
    // Process timeline data for visualization
    window.timelineTimeBlocks = window.filteredRawData.map((item, index) => {
        const [hours, minutes] = item.time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        return {
            index,
            time: item.time,
            formattedTime: formatTime(item.time),
            totalMinutes,
            withKidActivity: item.withKid,
            withKidCategory: item.withKidCategory,
            withoutKidActivity: item.withoutKid,
            withoutKidCategory: item.withoutKidCategory
        };
    });
    
    // Add summary statistics for grid comparison
    window.summaryStats = {
        withKids: {
            self: window.timelineTimeBlocks.filter(d => d.withKidCategory === 'Self').length,
            kid: window.timelineTimeBlocks.filter(d => d.withKidCategory === 'Kid').length,
            work: window.timelineTimeBlocks.filter(d => d.withKidCategory === 'Work').length
        },
        withoutKids: {
            self: window.timelineTimeBlocks.filter(d => d.withoutKidCategory === 'Self').length,
            kid: window.timelineTimeBlocks.filter(d => d.withoutKidCategory === 'Kid').length,
            work: window.timelineTimeBlocks.filter(d => d.withoutKidCategory === 'Work').length
        }
    };
    
    window.categoryPercentages = {
        withKids: calculateCategoryPercentages(window.timelineTimeBlocks, 'withKids'),
        withoutKids: calculateCategoryPercentages(window.timelineTimeBlocks, 'withoutKids')
    };
    
    console.log("Timeline data processed:", window.timelineTimeBlocks.length, "time blocks");
    console.log("Activity groups:", window.activityGroups.length, "groups");
    window.dispatchEvent(new Event('data-ready'));
}

// Color mapping - Updated colors
const colorMapping = {
    'Self': '#E7B5AC',
    'Kid': '#FDE9EA', 
    'Work': '#869F77'
};

// Helper functions
function getCategoryColor(category) {
    return colorMapping[category] || '#95A5A6';
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDuration(duration) {
    const totalMinutes = duration * 15;
    if (totalMinutes < 60) {
        return `${totalMinutes} minutes`;
    } else {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
}

// Calculate category percentages
function calculateCategoryPercentages(data, scenario) {
    const total = data.length;
    const categoryKey = scenario === 'withKids' ? 'withKidCategory' : 'withoutKidCategory';
    
    const counts = {
        'Self': data.filter(d => d[categoryKey] === 'Self').length,
        'Kid': data.filter(d => d[categoryKey] === 'Kid').length,
        'Work': data.filter(d => d[categoryKey] === 'Work').length
    };
    
    return {
        'Self': Math.round((counts.Self / total) * 100),
        'Kid': Math.round((counts.Kid / total) * 100),
        'Work': Math.round((counts.Work / total) * 100),
        counts: counts,
        total: total
    };
}

// Load CSV if available. If CSV fetch fails (e.g., opened via file://), fall back.
(function loadData() {
    const csvPath = 'working mom - Sheet1 (1).csv';
    if (typeof d3 !== 'undefined' && d3.csv) {
        d3.csv(csvPath).then(rows => {
            if (rows && rows.length) {
                // Try to infer column names (case-insensitive)
                const cols = Object.keys(rows[0]);
                const col = name => cols.find(c => c.toLowerCase().includes(name));
                const get = (r, key) => r[key] ?? '';
                const tCol = col('time') || 'time';
                const wkCol = col('with') || 'withKid';
                const wkCatCol = col('with') && col('category') ? col('category') : 'withKidCategory';
                const woutCol = col('without') || 'withoutKid';
                const woutCatCol = cols.find(c => /without.*category/i.test(c)) || 'withoutKidCategory';
                rawData = rows.map(r => ({
                    time: get(r, tCol).trim(),
                    withKid: get(r, wkCol).trim(),
                    withKidCategory: get(r, wkCatCol).trim(),
                    withoutKid: get(r, woutCol).trim(),
                    withoutKidCategory: get(r, woutCatCol).trim()
                }));
                computeAndPublish(rawData);
            } else {
                rawData = defaultRawData;
                computeAndPublish(rawData);
            }
        }).catch(err => {
            console.warn('CSV load failed, using default data', err);
            rawData = defaultRawData;
            computeAndPublish(rawData);
        });
    } else {
        rawData = rawData || defaultRawData;
        computeAndPublish(rawData);
    }
})();
