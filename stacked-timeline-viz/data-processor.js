// Data processing for stacked column chart
class DataProcessor {
    constructor() {
        this.rawData = [];
        this.summaryData = null;
        this.detailedData = [];
        this.colors = {
            'Self': '#DE4764',
            'Work': '#8DA650', 
            'Kid': '#E6EC9C'
        };
    }

    // Load and process CSV data
    async loadData() {
        try {
            console.log('Loading CSV data...');
            const csvData = await d3.csv('working-mom-data-cleaned.csv');
            console.log('CSV loaded:', csvData.length, 'rows');
            console.log('CSV sample row:', csvData[0]);
            console.log('CSV columns:', csvData.length > 0 ? Object.keys(csvData[0]) : 'No data');
            
            if (csvData.length === 0) {
                console.warn('CSV file is empty, using fallback data');
                return this.loadFallbackData();
            }
            
            this.rawData = this.processRawData(csvData);
            this.summaryData = this.createSummaryData();
            this.detailedData = this.createDetailedData();
            
            console.log('Data processing complete');
            console.log('Summary data:', this.summaryData);
            
            return {
                summary: this.summaryData,
                detailed: this.detailedData,
                raw: this.rawData
            };
        } catch (error) {
            console.error('Error loading CSV data:', error);
            console.log('Using fallback data instead...');
            return this.loadFallbackData();
        }
    }

    // Fallback data if CSV loading fails - Complete 24-hour day
    loadFallbackData() {
        console.log('Loading complete 24-hour fallback data...');
        
        // Create complete 24-hour dataset (4:00 AM to 3:45 AM next day)
        const fallbackRawData = [];
        
        // Generate time slots for 24 hours starting from 4:00 AM
        for (let hour = 4; hour < 28; hour++) { // 4 AM to 3:45 AM next day
            for (let minute = 0; minute < 60; minute += 15) {
                const actualHour = hour >= 24 ? hour - 24 : hour;
                const timeString = `${actualHour}:${minute.toString().padStart(2, '0')}`;
                
                let withKidActivity, withKidCategory, withoutKidActivity, withoutKidCategory;
                
                // Define activities based on time of day
                if (actualHour >= 4 && actualHour < 7) {
                    // Early morning 4-7 AM
                    if (actualHour === 4 && minute === 0) {
                        withKidActivity = 'Sleep'; withKidCategory = 'Self';
                    } else if (actualHour === 4 && minute === 15) {
                        withKidActivity = 'Alarm goes off'; withKidCategory = 'Self';
                    } else if (actualHour >= 4 && actualHour < 5) {
                        withKidActivity = 'Get ready'; withKidCategory = 'Self';
                    } else {
                        withKidActivity = 'Work out'; withKidCategory = 'Self';
                    }
                    withoutKidActivity = 'Sleep'; withoutKidCategory = 'Self';
                    
                } else if (actualHour >= 7 && actualHour < 9) {
                    // Morning routine 7-9 AM
                    withKidActivity = 'Wake up son and get ready'; withKidCategory = 'Kid';
                    withoutKidActivity = 'Get ready for work'; withoutKidCategory = 'Self';
                    
                } else if (actualHour >= 9 && actualHour < 15) {
                    // Work hours 9 AM - 3 PM
                    withKidActivity = 'Work'; withKidCategory = 'Work';
                    withoutKidActivity = 'Work'; withoutKidCategory = 'Work';
                    
                } else if (actualHour >= 15 && actualHour < 18) {
                    // After school 3-6 PM
                    withKidActivity = 'Pick up son and activities'; withKidCategory = 'Kid';
                    withoutKidActivity = 'Work'; withoutKidCategory = 'Work';
                    
                } else if (actualHour >= 18 && actualHour < 21) {
                    // Evening 6-9 PM
                    withKidActivity = 'Dinner and family time'; withKidCategory = 'Kid';
                    withoutKidActivity = 'Personal time'; withoutKidCategory = 'Self';
                    
                } else if (actualHour >= 21 && actualHour < 22) {
                    // Bedtime routine 9-10 PM
                    withKidActivity = 'Bedtime routine'; withKidCategory = 'Kid';
                    withoutKidActivity = 'Leisure time'; withoutKidCategory = 'Self';
                    
                } else {
                    // Sleep time 10 PM - 4 AM
                    withKidActivity = 'Sleep'; withKidCategory = 'Self';
                    withoutKidActivity = 'Sleep'; withoutKidCategory = 'Self';
                }
                
                fallbackRawData.push({
                    time: timeString,
                    withKidActivity: withKidActivity,
                    withKidCategory: withKidCategory,
                    withoutKidActivity: withoutKidActivity,
                    withoutKidCategory: withoutKidCategory
                });
                
                // Stop at midnight (0:00)
                if (actualHour === 0 && minute === 0) break;
            }
            if (actualHour === 0) break; // Stop after midnight
        }
        
        console.log('Generated fallback data with', fallbackRawData.length, 'time slots');
        
        this.rawData = fallbackRawData;
        this.summaryData = this.createSummaryData();
        this.detailedData = this.createDetailedData();
        
        console.log('Fallback data loaded successfully - Total hours:', this.summaryData[0].totalHours);
        
        return {
            summary: this.summaryData,
            detailed: this.detailedData,
            raw: this.rawData
        };
    }

    // Process raw CSV data
    processRawData(csvData) {
        console.log('Processing raw CSV data...');
        
        return csvData.map(row => {
            return {
                time: row['Time'],
                withKidActivity: (row['Things she did(With kid)'] || '').trim(),
                withKidCategory: this.normalizeCategory(row['Categories(with kid)'] || 'Self'),
                withoutKidActivity: (row['Things she did(Without kid)'] || '').trim(),
                withoutKidCategory: this.normalizeCategory(row['Categories(without kid)'] || 'Self')
            };
        }).filter(item => item.time); // Remove empty rows
    }

    // Normalize category names
    normalizeCategory(category) {
        const normalized = category.toLowerCase().trim();
        if (normalized === 'kid' || normalized === 'child') return 'Kid';
        if (normalized === 'work') return 'Work';
        return 'Self';
    }

    // Create summary data for stacked columns
    createSummaryData() {
        console.log('Creating summary data for stacked columns...');
        
        const categories = ['Self', 'Work', 'Kid'];
        const timelines = ['withKid', 'withoutKid'];
        
        const summaryData = timelines.map(timeline => {
            const categoryData = categories.map(category => {
                const count = this.rawData.filter(item => {
                    const itemCategory = timeline === 'withKid' ? item.withKidCategory : item.withoutKidCategory;
                    return itemCategory === category;
                }).length;
                
                // Each slot is 15 minutes, so multiply by 15 to get total minutes
                const minutes = count * 15;
                const hours = minutes / 60;
                
                return {
                    category: category,
                    count: count,
                    minutes: minutes,
                    hours: hours,
                    color: this.colors[category],
                    percentage: (count / this.rawData.length) * 100
                };
            });
            
            return {
                timeline: timeline,
                label: timeline === 'withKid' ? 'With Kid' : 'Without Kid',
                categories: categoryData,
                totalHours: categoryData.reduce((sum, cat) => sum + cat.hours, 0)
            };
        });
        
        return summaryData;
    }

    // Create detailed data for grid plot (each 15-min slot)
    createDetailedData() {
        console.log('Creating detailed data for grid plot...');
        
        const detailedData = [];
        
        this.rawData.forEach((item, index) => {
            // Parse time to get hour and minute
            const [hours, minutes] = item.time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            
            // Calculate position in 24-hour grid
            const hourIndex = hours;
            const minuteIndex = Math.floor(minutes / 15); // 0, 1, 2, 3 for 00, 15, 30, 45
            
            // With Kid data
            detailedData.push({
                timeline: 'withKid',
                timeSlot: index,
                time: item.time,
                hour: hours,
                minute: minutes,
                hourIndex: hourIndex,
                minuteIndex: minuteIndex,
                totalMinutes: totalMinutes,
                activity: item.withKidActivity,
                category: item.withKidCategory,
                color: this.colors[item.withKidCategory],
                x: hourIndex,
                y: minuteIndex,
                gridX: 0, // Left column for 'with kid'
                gridY: index // Sequential positioning
            });
            
            // Without Kid data
            detailedData.push({
                timeline: 'withoutKid',
                timeSlot: index,
                time: item.time,
                hour: hours,
                minute: minutes,
                hourIndex: hourIndex,
                minuteIndex: minuteIndex,
                totalMinutes: totalMinutes,
                activity: item.withoutKidActivity,
                category: item.withoutKidCategory,
                color: this.colors[item.withoutKidCategory],
                x: hourIndex,
                y: minuteIndex,
                gridX: 1, // Right column for 'without kid'
                gridY: index // Sequential positioning
            });
        });
        
        return detailedData;
    }

    // Get statistics for info panel
    getStatistics() {
        if (!this.summaryData) return null;
        
        const stats = {};
        
        this.summaryData.forEach(timeline => {
            stats[timeline.timeline] = {
                total: timeline.totalHours,
                categories: {}
            };
            
            timeline.categories.forEach(cat => {
                stats[timeline.timeline].categories[cat.category] = {
                    hours: cat.hours,
                    percentage: cat.percentage,
                    minutes: cat.minutes
                };
            });
        });
        
        return stats;
    }

    // Get comparison insights
    getComparisons() {
        if (!this.summaryData) return [];
        
        const withKid = this.summaryData.find(d => d.timeline === 'withKid');
        const withoutKid = this.summaryData.find(d => d.timeline === 'withoutKid');
        
        const comparisons = [];
        
        ['Self', 'Work', 'Kid'].forEach(category => {
            const withKidCat = withKid.categories.find(c => c.category === category);
            const withoutKidCat = withoutKid.categories.find(c => c.category === category);
            
            const difference = withKidCat.hours - withoutKidCat.hours;
            
            comparisons.push({
                category: category,
                withKid: withKidCat.hours,
                withoutKid: withoutKidCat.hours,
                difference: difference,
                percentageChange: withoutKidCat.hours > 0 ? (difference / withoutKidCat.hours) * 100 : 0
            });
        });
        
        return comparisons;
    }

    // Format time for display
    formatTime(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    // Format percentage for display
    formatPercentage(percentage) {
        return `${Math.round(percentage)}%`;
    }
}

// Global instance
const dataProcessor = new DataProcessor();
