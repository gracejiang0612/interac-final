// Data processing for working mother timeline
class TimelineData {
    constructor() {
        this.rawData = [];
        this.timeBlocks = [];
        this.colors = {
            'Self': '#DE4764',
            'Work': '#8DA650',
            'Kid': '#E6EC9C'
        };
    }

    // Load and process CSV data
    async loadData() {
        try {
            console.log('Attempting to load CSV data...');
            const csvData = await d3.csv('working-mom-data-cleaned.csv');
            console.log('CSV loaded, rows:', csvData.length);
            
            if (csvData.length === 0) {
                console.warn('CSV file is empty, using fallback data');
                return this.loadFallbackData();
            }
            
            this.rawData = this.processCSVData(csvData);
            this.timeBlocks = this.createTimeBlocks(this.rawData);
            console.log('Data processed successfully:', this.timeBlocks.length, 'time blocks');
            console.log('Sample time blocks:', this.timeBlocks.slice(0, 3));
            return this.timeBlocks;
        } catch (error) {
            console.error('Error loading CSV data:', error);
            console.log('Using fallback data instead...');
            return this.loadFallbackData();
        }
    }

    // Fallback data if CSV loading fails
    loadFallbackData() {
        console.log('Loading fallback data...');
        const fallbackData = [
            { time: 0, timeString: '4:00', withKidActivity: 'Sleep', withKidCategory: 'Self', withoutKidActivity: 'Sleep', withoutKidCategory: 'Self' },
            { time: 15, timeString: '4:15', withKidActivity: 'Alarm goes off', withKidCategory: 'Self', withoutKidActivity: 'Sleep', withoutKidCategory: 'Self' },
            { time: 30, timeString: '4:30', withKidActivity: 'Get up, brush teeth, fix hair, get dressed, start coffee maker', withKidCategory: 'Self', withoutKidActivity: 'Sleep', withoutKidCategory: 'Self' },
            { time: 45, timeString: '4:45', withKidActivity: 'Leave for gym', withKidCategory: 'Self', withoutKidActivity: 'Sleep', withoutKidCategory: 'Self' },
            { time: 60, timeString: '5:00', withKidActivity: 'Work out', withKidCategory: 'Self', withoutKidActivity: 'Sleep', withoutKidCategory: 'Self' },
            { time: 480, timeString: '12:00', withKidActivity: 'Lunch', withKidCategory: 'Self', withoutKidActivity: 'Work', withoutKidCategory: 'Work' },
            { time: 900, timeString: '19:00', withKidActivity: 'Dinner with son', withKidCategory: 'Kid', withoutKidActivity: 'Work', withoutKidCategory: 'Work' },
            { time: 1200, timeString: '0:00', withKidActivity: 'Sleep', withKidCategory: 'Self', withoutKidActivity: 'Sleep', withoutKidCategory: 'Self' }
        ];
        
        this.rawData = fallbackData;
        this.timeBlocks = this.createTimeBlocks(fallbackData);
        console.log('Fallback data loaded:', this.timeBlocks.length, 'time blocks');
        return this.timeBlocks;
    }

    // Process CSV data into standardized format
    processCSVData(csvData) {
        console.log('Processing CSV data, sample row:', csvData[0]);
        console.log('Available columns:', Object.keys(csvData[0] || {}));
        
        const processed = csvData.map((row, index) => {
            const timeValue = this.parseTime(row['Time']);
            if (index < 3) {
                console.log(`Row ${index}: Time="${row['Time']}" -> ${timeValue} minutes`);
            }
            
            return {
                time: timeValue,
                timeString: row['Time'],
                withKidActivity: (row['Things she did(With kid)'] || '').trim(),
                withKidCategory: this.normalizeCategory(row['Categories(with kid)'] || 'Self'),
                withoutKidActivity: (row['Things she did(Without kid)'] || '').trim(),
                withoutKidCategory: this.normalizeCategory(row['Categories(without kid)'] || 'Self')
            };
        }).filter(item => item.time !== null);
        
        console.log('Processed data length:', processed.length);
        console.log('Sample processed items:', processed.slice(0, 3));

        // Fill empty "without kid" activities
        this.fillEmptyActivities(processed);
        
        // Stop at midnight (0:00)
        const midnightIndex = processed.findIndex(item => item.timeString === '0:00');
        if (midnightIndex !== -1) {
            const finalData = processed.slice(0, midnightIndex + 1);
            console.log('Data truncated at midnight. Final processed data length:', finalData.length);
            return finalData;
        }
        
        console.log('No midnight found, returning all processed data:', processed.length);
        return processed;
    }

    // Parse time string to minutes from 4:00 AM
    parseTime(timeString) {
        if (!timeString) return null;
        
        const [hours, minutes] = timeString.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        
        // Convert to minutes from 4:00 AM start
        let totalMinutes;
        if (hours >= 4) {
            totalMinutes = (hours - 4) * 60 + minutes;
        } else {
            // Next day (0:00, 1:00, 2:00, 3:00)
            totalMinutes = (20 + hours) * 60 + minutes;
        }
        
        return totalMinutes;
    }

    // Normalize category names
    normalizeCategory(category) {
        const normalized = category.toLowerCase().trim();
        if (normalized === 'kid' || normalized === 'child') return 'Kid';
        if (normalized === 'work') return 'Work';
        return 'Self';
    }

    // Fill empty activities with previous activity
    fillEmptyActivities(data) {
        let lastWithoutActivity = 'Sleep';
        let lastWithoutCategory = 'Self';
        
        data.forEach(item => {
            if (!item.withoutKidActivity) {
                item.withoutKidActivity = lastWithoutActivity;
                item.withoutKidCategory = lastWithoutCategory;
            } else {
                lastWithoutActivity = item.withoutKidActivity;
                lastWithoutCategory = item.withoutKidCategory;
            }
        });
    }

    // Create time blocks by grouping consecutive similar activities
    createTimeBlocks(data) {
        const blocks = [];
        let currentWithKidBlock = null;
        let currentWithoutKidBlock = null;

        data.forEach((item, index) => {
            // Process "with kid" timeline
            if (!currentWithKidBlock || 
                currentWithKidBlock.activity !== item.withKidActivity ||
                currentWithKidBlock.category !== item.withKidCategory) {
                
                if (currentWithKidBlock) {
                    blocks.push({...currentWithKidBlock, timeline: 'withKid'});
                }
                
                currentWithKidBlock = {
                    activity: item.withKidActivity,
                    category: item.withKidCategory,
                    startTime: item.time,
                    endTime: item.time + 15,
                    startTimeString: item.timeString,
                    endTimeString: this.getNextTimeString(item.timeString),
                    duration: 15,
                    color: this.colors[item.withKidCategory]
                };
            } else {
                currentWithKidBlock.endTime = item.time + 15;
                currentWithKidBlock.endTimeString = this.getNextTimeString(item.timeString);
                currentWithKidBlock.duration += 15;
            }

            // Process "without kid" timeline
            if (!currentWithoutKidBlock || 
                currentWithoutKidBlock.activity !== item.withoutKidActivity ||
                currentWithoutKidBlock.category !== item.withoutKidCategory) {
                
                if (currentWithoutKidBlock) {
                    blocks.push({...currentWithoutKidBlock, timeline: 'withoutKid'});
                }
                
                currentWithoutKidBlock = {
                    activity: item.withoutKidActivity,
                    category: item.withoutKidCategory,
                    startTime: item.time,
                    endTime: item.time + 15,
                    startTimeString: item.timeString,
                    endTimeString: this.getNextTimeString(item.timeString),
                    duration: 15,
                    color: this.colors[item.withoutKidCategory]
                };
            } else {
                currentWithoutKidBlock.endTime = item.time + 15;
                currentWithoutKidBlock.endTimeString = this.getNextTimeString(item.timeString);
                currentWithoutKidBlock.duration += 15;
            }
        });

        // Add final blocks
        if (currentWithKidBlock) {
            blocks.push({...currentWithKidBlock, timeline: 'withKid'});
        }
        if (currentWithoutKidBlock) {
            blocks.push({...currentWithoutKidBlock, timeline: 'withoutKid'});
        }

        return blocks.sort((a, b) => a.startTime - b.startTime);
    }

    // Get next time string (for display purposes)
    getNextTimeString(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        let nextMinutes = minutes + 15;
        let nextHours = hours;
        
        if (nextMinutes >= 60) {
            nextMinutes = 0;
            nextHours = (nextHours + 1) % 24;
        }
        
        return `${nextHours}:${nextMinutes.toString().padStart(2, '0')}`;
    }

    // Get scroll blocks for major activity transitions (not every 15 minutes)
    getScrollBlocks() {
        console.log('Creating scroll blocks from time blocks:', this.timeBlocks.length, 'blocks');
        
        // Get unique start times from grouped blocks (activity changes)
        const withKidBlocks = this.timeBlocks.filter(b => b.timeline === 'withKid').sort((a, b) => a.startTime - b.startTime);
        const withoutKidBlocks = this.timeBlocks.filter(b => b.timeline === 'withoutKid').sort((a, b) => a.startTime - b.startTime);
        
        // Get all unique transition times
        const allTransitionTimes = new Set();
        withKidBlocks.forEach(block => allTransitionTimes.add(block.startTime));
        withoutKidBlocks.forEach(block => allTransitionTimes.add(block.startTime));
        
        // Convert to sorted array
        const sortedTimes = Array.from(allTransitionTimes).sort((a, b) => a - b);
        console.log('Transition times found:', sortedTimes.length);
        
        // Create scroll blocks for each transition time
        return sortedTimes.map(time => {
            const withKidBlock = withKidBlocks.find(b => b.startTime <= time && b.endTime > time) || 
                                withKidBlocks.find(b => b.startTime === time);
            const withoutKidBlock = withoutKidBlocks.find(b => b.startTime <= time && b.endTime > time) || 
                                   withoutKidBlocks.find(b => b.startTime === time);
            
            return {
                time: time,
                timeString: this.minutesToTimeString(time),
                withKid: withKidBlock ? {
                    activity: withKidBlock.activity,
                    category: withKidBlock.category,
                    startTime: withKidBlock.startTime,
                    endTime: withKidBlock.endTime,
                    startTimeString: withKidBlock.startTimeString,
                    endTimeString: withKidBlock.endTimeString,
                    duration: withKidBlock.duration,
                    color: withKidBlock.color
                } : null,
                withoutKid: withoutKidBlock ? {
                    activity: withoutKidBlock.activity,
                    category: withoutKidBlock.category,
                    startTime: withoutKidBlock.startTime,
                    endTime: withoutKidBlock.endTime,
                    startTimeString: withoutKidBlock.startTimeString,
                    endTimeString: withoutKidBlock.endTimeString,
                    duration: withoutKidBlock.duration,
                    color: withoutKidBlock.color
                } : null
            };
        });
    }

    // Get individual 15-minute slots for detailed visualization
    getDetailedTimeSlots() {
        console.log('Creating detailed time slots from raw data:', this.rawData.length, 'slots');
        
        return this.rawData.map(item => {
            return {
                time: item.time,
                timeString: item.timeString,
                withKidActivity: item.withKidActivity,
                withKidCategory: item.withKidCategory,
                withoutKidActivity: item.withoutKidActivity,
                withoutKidCategory: item.withoutKidCategory
            };
        }).sort((a, b) => a.time - b.time);
    }

    // Convert minutes back to time string
    minutesToTimeString(minutes) {
        const hours = Math.floor(minutes / 60) + 4;
        const mins = minutes % 60;
        const displayHours = hours >= 24 ? hours - 24 : hours;
        return `${displayHours}:${mins.toString().padStart(2, '0')}`;
    }

    // Get data for grid plot
    getGridData() {
        const categories = ['Self', 'Work', 'Kid'];
        const timelines = ['withKid', 'withoutKid'];
        const gridData = [];

        timelines.forEach((timeline, timelineIndex) => {
            categories.forEach((category, categoryIndex) => {
                const blocks = this.timeBlocks.filter(b => 
                    b.timeline === timeline && b.category === category
                );
                const totalMinutes = blocks.reduce((sum, block) => sum + block.duration, 0);
                const hours = totalMinutes / 60;

                gridData.push({
                    timeline: timeline,
                    category: category,
                    timelineIndex: timelineIndex,
                    categoryIndex: categoryIndex,
                    hours: hours,
                    minutes: totalMinutes,
                    color: this.colors[category],
                    label: `${timeline === 'withKid' ? 'With Kid' : 'Without Kid'} - ${category}`,
                    timeLabel: `${hours.toFixed(1)} hours`
                });
            });
        });

        return gridData;
    }

    // Get summary statistics
    getSummary() {
        const withKidBlocks = this.timeBlocks.filter(b => b.timeline === 'withKid');
        const withoutKidBlocks = this.timeBlocks.filter(b => b.timeline === 'withoutKid');

        const getSummaryByCategory = (blocks) => {
            const summary = {};
            ['Self', 'Work', 'Kid'].forEach(category => {
                const categoryBlocks = blocks.filter(b => b.category === category);
                const totalMinutes = categoryBlocks.reduce((sum, block) => sum + block.duration, 0);
                summary[category] = {
                    minutes: totalMinutes,
                    hours: totalMinutes / 60,
                    blocks: categoryBlocks.length
                };
            });
            return summary;
        };

        return {
            withKid: getSummaryByCategory(withKidBlocks),
            withoutKid: getSummaryByCategory(withoutKidBlocks),
            totalBlocks: this.timeBlocks.length
        };
    }
}

// Global instance
const timelineData = new TimelineData();
