// Working Mom Story Data Processing
// Loads CSV and groups consecutive identical activities

let storyData = null;
let activityBlocks = [];
let isDataReady = false;

// Color mapping for categories
const categoryColors = {
    'Self': '#E7B5AC',
    'Kid': '#FDE9EA',
    'Work': '#869F77'
};

// Get color for category
function getCategoryColor(category) {
    return categoryColors[category] || '#95A5A6';
}

// Format time string
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Calculate duration in minutes
function calculateDuration(startTime, endTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let start = startHours * 60 + startMinutes;
    let end = endHours * 60 + endMinutes;
    
    // Handle next day (end time < start time)
    if (end < start) {
        end += 24 * 60;
    }
    
    return end - start;
}

// Group consecutive identical activities
function groupConsecutiveActivities(rawData) {
    if (!rawData || rawData.length === 0) return [];
    
    const groups = [];
    let currentGroup = null;
    
    rawData.forEach((item, index) => {
        // Clean up activity text
        const withKidActivity = (item.withKidActivity || '').trim();
        const withoutKidActivity = (item.withoutKidActivity || '').trim();
        
        // Skip empty activities
        if (!withKidActivity && !withoutKidActivity) return;
        
        // Check if we should start a new group
        const shouldStartNewGroup = !currentGroup || 
            currentGroup.withKidActivity !== withKidActivity ||
            currentGroup.withKidCategory !== item.withKidCategory;
            
        if (shouldStartNewGroup) {
            // Save previous group
            if (currentGroup) {
                groups.push(currentGroup);
            }
            
            // Start new group
            currentGroup = {
                id: groups.length,
                startTime: item.time,
                endTime: item.time,
                withKidActivity: withKidActivity,
                withKidCategory: item.withKidCategory,
                withoutKidActivity: withoutKidActivity,
                withoutKidCategory: item.withoutKidCategory,
                timeSlots: [item],
                duration: 15 // First slot
            };
        } else {
            // Extend current group
            currentGroup.endTime = item.time;
            currentGroup.timeSlots.push(item);
            currentGroup.duration += 15;
            
            // Update without kid activity if it changes within the group
            if (currentGroup.withoutKidActivity !== withoutKidActivity) {
                if (!currentGroup.withoutKidActivity.includes(withoutKidActivity)) {
                    currentGroup.withoutKidActivity += ` → ${withoutKidActivity}`;
                }
            }
        }
    });
    
    // Add final group
    if (currentGroup) {
        groups.push(currentGroup);
    }
    
    // Calculate formatted times and durations
    groups.forEach(group => {
        group.formattedStartTime = formatTime(group.startTime);
        group.formattedEndTime = formatTime(group.endTime);
        group.timeRange = group.duration > 15 ? 
            `${group.formattedStartTime} - ${group.formattedEndTime}` : 
            group.formattedStartTime;
        group.durationText = group.duration >= 60 ? 
            `${Math.floor(group.duration / 60)}h ${group.duration % 60}m` :
            `${group.duration}m`;
    });
    
    return groups;
}

// Process CSV data
function processCSVData(csvData) {
    console.log('Processing CSV data:', csvData.length, 'rows');
    
    // Convert CSV to our format using exact column names
    const processedData = csvData.map(row => {
        return {
            time: (row['Time'] || '').trim(),
            withKidActivity: (row['Things she did(With kid)'] || '').trim(),
            withKidCategory: (row['Categories(with kid)'] || 'Self').trim(),
            withoutKidActivity: (row['Things she did(Without kid)'] || '').trim(),
            withoutKidCategory: (row['Categories(without kid)'] || 'Self').trim()
        };
    }).filter(item => item.time); // Remove rows without time
    
    // Handle empty "without kid" activities by using previous non-empty activity
    let lastWithoutKidActivity = 'Sleep';
    let lastWithoutKidCategory = 'Self';
    
    processedData.forEach(item => {
        // If without kid activity is empty, use the last known activity
        if (!item.withoutKidActivity) {
            item.withoutKidActivity = lastWithoutKidActivity;
            item.withoutKidCategory = lastWithoutKidCategory;
        } else {
            lastWithoutKidActivity = item.withoutKidActivity;
            lastWithoutKidCategory = item.withoutKidCategory;
        }
        
        // Normalize category capitalization
        item.withKidCategory = normalizeCategory(item.withKidCategory);
        item.withoutKidCategory = normalizeCategory(item.withoutKidCategory);
    });
    
    console.log('Processed data:', processedData.length, 'time slots');
    console.log('Sample processed data:', processedData.slice(0, 5));
    
    // Group the activities
    const grouped = groupConsecutiveActivities(processedData);
    console.log('Activity groups:', grouped.length, 'groups');
    
    return {
        rawData: processedData,
        activityBlocks: grouped
    };
}

// Normalize category names
function normalizeCategory(category) {
    const normalized = category.toLowerCase().trim();
    if (normalized === 'kid' || normalized === 'child') return 'Kid';
    if (normalized === 'work') return 'Work';
    return 'Self'; // Default to Self for any other category
}

// Load data from CSV
function loadStoryData() {
    const csvPath = 'working mom - Sheet1 (1).csv';
    
    if (typeof d3 !== 'undefined' && d3.csv) {
        console.log('Loading CSV data from:', csvPath);
        
        d3.csv(csvPath).then(data => {
            console.log('CSV loaded successfully:', data.length, 'rows');
            
            if (data && data.length > 0) {
                const processed = processCSVData(data);
                storyData = processed.rawData;
                activityBlocks = processed.activityBlocks;
                isDataReady = true;
                
                console.log('Story data ready:', {
                    timeSlots: storyData.length,
                    activityBlocks: activityBlocks.length,
                    firstBlock: activityBlocks[0],
                    lastBlock: activityBlocks[activityBlocks.length - 1]
                });
                
                // Dispatch event to notify other scripts
                window.dispatchEvent(new CustomEvent('storyDataReady', {
                    detail: { storyData, activityBlocks }
                }));
            } else {
                console.error('No data found in CSV');
                loadFallbackData();
            }
        }).catch(error => {
            console.error('Failed to load CSV:', error);
            loadFallbackData();
        });
    } else {
        console.warn('D3.js not available, loading fallback data');
        loadFallbackData();
    }
}

// Fallback data if CSV loading fails
function loadFallbackData() {
    console.log('Loading fallback data');
    
    // Sample data structure
    const fallbackData = [
        {time: "4:00", withKidActivity: "Sleep", withKidCategory: "Self", withoutKidActivity: "Sleep", withoutKidCategory: "Self"},
        {time: "4:15", withKidActivity: "Alarm goes off", withKidCategory: "Self", withoutKidActivity: "Sleep", withoutKidCategory: "Self"},
        {time: "4:30", withKidActivity: "Get up, brush teeth, fix hair, get dressed, start coffee maker", withKidCategory: "Self", withoutKidActivity: "Sleep", withoutKidCategory: "Self"},
        {time: "5:00", withKidActivity: "Work out", withKidCategory: "Self", withoutKidActivity: "Sleep", withoutKidCategory: "Self"},
        {time: "5:15", withKidActivity: "Work out", withKidCategory: "Self", withoutKidActivity: "Sleep", withoutKidCategory: "Self"},
        {time: "6:00", withKidActivity: "Arrive at home. Have a cup of coffee", withKidCategory: "Self", withoutKidActivity: "Wake up and go to gym", withoutKidCategory: "Self"},
        {time: "7:00", withKidActivity: "Wake up son", withKidCategory: "Kid", withoutKidActivity: "Gym workout", withoutKidCategory: "Self"},
        {time: "8:00", withKidActivity: "Take son to school", withKidCategory: "Kid", withoutKidActivity: "Get ready for work", withoutKidCategory: "Self"},
        {time: "9:00", withKidActivity: "Work event", withKidCategory: "Work", withoutKidActivity: "Work", withoutKidCategory: "Work"}
    ];
    
    const processed = processCSVData(fallbackData);
    storyData = processed.rawData;
    activityBlocks = processed.activityBlocks;
    isDataReady = true;
    
    window.dispatchEvent(new CustomEvent('storyDataReady', {
        detail: { storyData, activityBlocks }
    }));
}

// Initialize data loading
loadStoryData();
