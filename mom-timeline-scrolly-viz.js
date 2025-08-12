// D3 Visualization for working mother timeline
class TimelineVisualization {
    constructor() {
        this.data = null;
        this.scrollBlocks = null;
        this.currentStep = 0;
        this.isGridMode = false;
        
        // Dimensions
        this.margin = { top: 60, right: 40, bottom: 60, left: 40 };
        this.width = 400;
        this.height = 600;
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        // Scales
        this.yScale = null;
        this.heightScale = null;
        
        // SVG containers
        this.leftSvg = null;
        this.rightSvg = null;
        
        this.init();
    }

    init() {
        this.setupSVG();
        this.setupScales();
    }

    setupSVG() {
        console.log('Setting up SVG containers...');
        
        // Check if containers exist
        const leftViz = d3.select('#left-viz');
        const rightViz = d3.select('#right-viz');
        
        if (leftViz.empty() || rightViz.empty()) {
            console.error('Visualization containers not found!');
            return;
        }
        
        // Left side SVG (with kid)
        this.leftSvg = leftViz
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background', 'transparent');

        this.leftGroup = this.leftSvg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);



        // Right side SVG (without kid)
        this.rightSvg = rightViz
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background', 'transparent');

        this.rightGroup = this.rightSvg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);


            
        console.log('SVG containers set up successfully');
    }

    setupScales() {
        // Y scale for timeline (time from 4:00 AM to midnight)
        this.yScale = d3.scaleLinear()
            .domain([0, 1200]) // 20 hours * 60 minutes
            .range([0, this.innerHeight]);

        // Height scale for time blocks (duration in minutes)
        this.heightScale = d3.scaleLinear()
            .domain([15, 300]) // 15 minutes to 5 hours
            .range([10, 200]);
    }

    async loadData() {
        const timeBlocks = await timelineData.loadData();
        this.scrollBlocks = timelineData.getScrollBlocks();
        this.detailedSlots = timelineData.getDetailedTimeSlots();
        
        // Convert timeBlocks to the format expected by visualization
        this.data = this.convertDataForVisualization(timeBlocks);
        
        console.log('Visualization data loaded:', this.scrollBlocks.length, 'scroll blocks');
        console.log('Converted visualization data:', this.data.length, 'timeline blocks');
        console.log('Detailed time slots:', this.detailedSlots.length, 'slots');
        this.drawInitialState();
    }
    
    convertDataForVisualization(timeBlocks) {
        const visualizationData = [];
        
        console.log('Converting data for visualization:', timeBlocks.length, 'time blocks');
        console.log('Sample time block:', timeBlocks[0]);
        
        // timeBlocks are already individual blocks with timeline property
        timeBlocks.forEach(block => {
            if (block.timeline === 'withKid') {
                visualizationData.push({
                    timeline: 'left',
                    startTime: block.startTime,
                    endTime: block.endTime,
                    activity: block.activity,
                    category: block.category,
                    color: block.color,
                    duration: block.duration
                });
            } else if (block.timeline === 'withoutKid') {
                visualizationData.push({
                    timeline: 'right',
                    startTime: block.startTime,
                    endTime: block.endTime,
                    activity: block.activity,
                    category: block.category,
                    color: block.color,
                    duration: block.duration
                });
            }
        });
        
        console.log('Converted to visualization data:', visualizationData.length, 'blocks');
        console.log('Left side blocks:', visualizationData.filter(b => b.timeline === 'left').length);
        console.log('Right side blocks:', visualizationData.filter(b => b.timeline === 'right').length);
        
        return visualizationData.sort((a, b) => a.startTime - b.startTime);
    }
    
    getColorByCategory(category) {
        const colors = {
            'Self': '#DE4764',
            'Work': '#8DA650', 
            'Kid': '#E6EC9C'
        };
        return colors[category] || '#ccc';
    }

    drawInitialState() {
        // Draw empty columns initially
        this.drawColumn('left', []);
        this.drawColumn('right', []);
    }

    drawColumn(side, blocks, currentTime = null, showComplete = false) {
        const svg = side === 'left' ? this.leftGroup : this.rightGroup;
        
        // Get the correct data format - this.data contains grouped blocks
        let visibleBlocks = [];
        
        if (showComplete && this.data) {
            // Show all blocks for complete timeline
            visibleBlocks = this.data.filter(block => block.timeline === side);
        } else if (currentTime !== null && this.data) {
            // Show blocks up to current time
            visibleBlocks = this.data.filter(block => 
                block.timeline === side && block.startTime <= currentTime
            );
        } else {
            // Show empty for intro or if no data
            visibleBlocks = [];
        }
        
        console.log(`Drawing ${side} column with ${visibleBlocks.length} blocks`);
        if (visibleBlocks.length > 0) {
            console.log(`Sample ${side} block:`, visibleBlocks[0]);
        }

        // Bind data
        const rects = svg.selectAll('.time-block')
            .data(visibleBlocks, d => `${d.startTime}-${d.activity || 'unknown'}`);

        // Remove old blocks
        rects.exit()
            .transition()
            .duration(500)
            .attr('opacity', 0)
            .remove();

        // Add new blocks
        const newRects = rects.enter()
            .append('rect')
            .attr('class', 'time-block')
            .attr('x', 50)
            .attr('width', this.innerWidth - 100)
            .attr('y', d => {
                const yPos = this.yScale(d.startTime);
                console.log(`Block at ${d.startTime} min positioned at y=${yPos}`);
                return yPos;
            })
            .attr('height', d => {
                const height = Math.max(this.yScale(d.duration || 15) - this.yScale(0), 5);
                console.log(`Block duration ${d.duration || 15} min = height ${height}px`);
                return height;
            })
            .attr('fill', d => d.color || this.getColorByCategory(d.category))
            .attr('opacity', 0)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('rx', 4);

        // Update existing blocks
        rects.merge(newRects)
            .transition()
            .duration(800)
            .attr('opacity', d => {
                if (showComplete) return 0.7;  // Show complete timeline with medium opacity
                if (currentTime === null) return 0;  // Hide if no current time
                // Check if current time falls within this block
                const isCurrentBlock = currentTime >= d.startTime && currentTime < d.endTime;
                return isCurrentBlock ? 1 : 0.4;
            })
            .attr('y', d => this.yScale(d.startTime))
            .attr('height', d => Math.max(this.yScale(d.duration || 15) - this.yScale(0), 5))
            .attr('fill', d => d.color);

        // Highlight current block
        if (currentTime !== null) {
            svg.selectAll('.time-block')
                .classed('current-block', d => currentTime >= d.startTime && currentTime < d.endTime);
        }
    }

    updateVisualization(stepIndex) {
        this.currentStep = stepIndex;
        
        // Handle special steps
        if (stepIndex === 'intro') {
            this.showIntroStep();
            return;
        } else if (stepIndex === 'complete') {
            this.showCompleteTimeline();
            return;
        }
        
        // Handle regular timeline steps
        if (!this.scrollBlocks || stepIndex >= this.scrollBlocks.length) return;
        
        const currentBlock = this.scrollBlocks[stepIndex];
        if (!currentBlock) return;

        // Update time display
        d3.select('#current-time')
            .text(this.formatTime(currentBlock.timeString));

        // Update columns - only show blocks up to current time
        this.drawColumn('left', this.data, currentBlock.time, false);
        this.drawColumn('right', this.data, currentBlock.time, false);

        // Update activity notes
        this.updateActivityNotes(currentBlock);

        // Scale current blocks to be larger
        this.scaleCurrentBlocks(currentBlock.time);
    }

    showIntroStep() {
        // Show initial empty state
        d3.select('#current-time').text('4:00 AM - Ready to Begin');
        this.drawColumn('left', [], null, false);
        this.drawColumn('right', [], null, false);
        this.updateActivityNotes(null);
        
        // Clear any existing grid plot
        d3.select('#grid-container').remove();
        
        console.log('Intro step activated');
    }

    showCompleteTimeline() {
        // Show complete timeline with all blocks
        console.log('Showing complete timeline with', this.data ? this.data.length : 0, 'blocks');
        d3.select('#current-time').text('Complete Day');
        this.drawColumn('left', this.data, null, true);
        this.drawColumn('right', this.data, null, true);
        this.updateActivityNotes(null);
        
        // Clear any scaling
        this.leftGroup.selectAll('.time-block').attr('transform', 'scale(1)');
        this.rightGroup.selectAll('.time-block').attr('transform', 'scale(1)');
        
        // Clear any existing grid plot
        d3.select('#grid-container').remove();
    }

    scaleCurrentBlocks(currentTime) {
        const scaleFactor = 4; // Make blocks 4 times larger as requested
        
        [this.leftGroup, this.rightGroup].forEach(svg => {
            svg.selectAll('.time-block')
                .transition()
                .duration(800)
                .attr('transform', d => {
                    // Check if this block contains the current time
                    const isCurrentBlock = currentTime >= d.startTime && currentTime < d.endTime;
                    if (isCurrentBlock) {
                        const centerY = this.yScale(d.startTime) + Math.max(this.yScale(d.duration || 15) - this.yScale(0), 5) / 2;
                        const newHeight = Math.max(this.yScale(d.duration || 15) - this.yScale(0), 5) * scaleFactor;
                        const newY = centerY - newHeight / 2;
                        return `translate(0, ${newY - this.yScale(d.startTime)}) scale(1, ${scaleFactor})`;
                    }
                    return 'scale(1, 1)';
                })
                .attr('opacity', d => {
                    const isCurrentBlock = currentTime >= d.startTime && currentTime < d.endTime;
                    return isCurrentBlock ? 1 : 0.2;
                });
        });
    }

    updateActivityNotes(currentBlock) {
        // Clear notes if no current block
        if (!currentBlock) {
            d3.select('#left-activity').classed('active', false);
            d3.select('#right-activity').classed('active', false);
            return;
        }

        // Left side activity note
        const leftNote = d3.select('#left-activity');
        if (currentBlock.withKid) {
            const startTime = currentBlock.withKid.startTimeString || this.minutesToTimeString(currentBlock.withKid.startTime);
            const endTime = currentBlock.withKid.endTimeString || this.minutesToTimeString(currentBlock.withKid.endTime);
            
            leftNote.html(`
                <strong>${this.formatTime(startTime)} - ${this.formatTime(endTime)}</strong><br>
                ${currentBlock.withKid.activity}<br>
                <small>${currentBlock.withKid.category} • ${Math.round(currentBlock.withKid.duration)} minutes</small>
            `)
            .classed('active', true);
        } else {
            leftNote.classed('active', false);
        }

        // Right side activity note
        const rightNote = d3.select('#right-activity');
        if (currentBlock.withoutKid) {
            const startTime = currentBlock.withoutKid.startTimeString || this.minutesToTimeString(currentBlock.withoutKid.startTime);
            const endTime = currentBlock.withoutKid.endTimeString || this.minutesToTimeString(currentBlock.withoutKid.endTime);
            
            rightNote.html(`
                <strong>${this.formatTime(startTime)} - ${this.formatTime(endTime)}</strong><br>
                ${currentBlock.withoutKid.activity}<br>
                <small>${currentBlock.withoutKid.category} • ${Math.round(currentBlock.withoutKid.duration)} minutes</small>
            `)
            .classed('active', true);
        } else {
            rightNote.classed('active', false);
        }
    }

    minutesToTimeString(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }

    showGridPlot() {
        this.isGridMode = true;
        const gridData = timelineData.getGridData();
        console.log('Grid data for plot:', gridData);
        
        // Clear existing content
        this.leftGroup.selectAll('*').remove();
        this.rightGroup.selectAll('*').remove();
        
        // Create combined SVG for grid plot
        const combinedSvg = d3.select('.viz-container')
            .append('div')
            .attr('id', 'grid-container')
            .style('position', 'absolute')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('z-index', '50')
            .append('svg')
            .attr('width', 800)
            .attr('height', 400)
            .style('background', 'rgba(255, 255, 255, 0.95)')
            .style('border-radius', '15px')
            .style('box-shadow', '0 10px 30px rgba(0, 0, 0, 0.2)');

        const gridGroup = combinedSvg.append('g')
            .attr('transform', 'translate(100, 50)');

        // Grid dimensions
        const cellSize = 80;
        const gridWidth = 2 * cellSize + 20; // 2 timelines
        const gridHeight = 3 * cellSize + 40; // 3 categories

        // Create grid cells
        const cells = gridGroup.selectAll('.grid-cell')
            .data(gridData)
            .enter()
            .append('rect')
            .attr('class', 'grid-cell')
            .attr('x', d => d.timelineIndex * (cellSize + 10))
            .attr('y', d => d.categoryIndex * (cellSize + 10))
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', d => d.color)
            .attr('opacity', 0)
            .attr('rx', 8);

        // Add text labels
        const labels = gridGroup.selectAll('.grid-label')
            .data(gridData)
            .enter()
            .append('text')
            .attr('class', 'grid-label')
            .attr('x', d => d.timelineIndex * (cellSize + 10) + cellSize / 2)
            .attr('y', d => d.categoryIndex * (cellSize + 10) + cellSize / 2 - 5)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('opacity', 0)
            .text(d => d.category);

        const timeLabels = gridGroup.selectAll('.time-label')
            .data(gridData)
            .enter()
            .append('text')
            .attr('class', 'time-label')
            .attr('x', d => d.timelineIndex * (cellSize + 10) + cellSize / 2)
            .attr('y', d => d.categoryIndex * (cellSize + 10) + cellSize / 2 + 8)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .style('opacity', 0)
            .text(d => d.timeLabel);

        // Add column headers
        const columnHeaders = ['With Kid', 'Without Kid'];
        gridGroup.selectAll('.column-header')
            .data(columnHeaders)
            .enter()
            .append('text')
            .attr('class', 'column-header')
            .attr('x', (d, i) => i * (cellSize + 10) + cellSize / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('opacity', 0)
            .text(d => d);

        // Add row headers
        const rowHeaders = ['Self', 'Work', 'Kid'];
        gridGroup.selectAll('.row-header')
            .data(rowHeaders)
            .enter()
            .append('text')
            .attr('class', 'row-header')
            .attr('x', -20)
            .attr('y', (d, i) => i * (cellSize + 10) + cellSize / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('opacity', 0)
            .text(d => d);

        // Animate in
        cells.transition()
            .delay((d, i) => i * 100)
            .duration(800)
            .attr('opacity', 0.8);

        labels.transition()
            .delay((d, i) => i * 100 + 400)
            .duration(800)
            .style('opacity', 1);

        timeLabels.transition()
            .delay((d, i) => i * 100 + 600)
            .duration(800)
            .style('opacity', 1);

        gridGroup.selectAll('.column-header, .row-header')
            .transition()
            .delay(200)
            .duration(800)
            .style('opacity', 1);

        // Hide activity notes
        d3.selectAll('.activity-note').classed('active', false);
        
        // Update time display
        d3.select('#current-time').text('Full Day Comparison');
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    reset() {
        this.isGridMode = false;
        this.currentStep = 0;
        
        // Remove grid container if exists
        d3.select('#grid-container').remove();
        
        // Reset to initial state
        this.drawInitialState();
        d3.select('#current-time').text('4:00 AM');
        d3.selectAll('.activity-note').classed('active', false);
    }
}

// Global instance
const timelineViz = new TimelineVisualization();
