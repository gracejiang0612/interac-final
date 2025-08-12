// Grid plot implementation for detailed time distribution
class GridPlot {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.data = null;
        this.svg = null;
        this.gridGroup = null;
        
        // Grid dimensions
        this.margin = { top: 60, right: 60, bottom: 60, left: 100 };
        this.width = 800;
        this.height = 500;
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        // Grid configuration
        this.cellSize = 8;
        this.cellPadding = 1;
        this.hoursPerRow = 24;
        this.slotsPerHour = 4; // 15-minute slots
        
        // Scales
        this.timeScale = null;
        this.colorScale = null;
        
        this.isVisible = false;
    }

    init() {
        // Create grid group (initially hidden)
        this.gridGroup = this.container.append('g')
            .attr('class', 'grid-container')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .style('opacity', 0);

        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip');

        this.setupScales();
    }

    setupScales() {
        // Color scale (same as stacked chart)
        this.colorScale = d3.scaleOrdinal()
            .domain(['Self', 'Work', 'Kid'])
            .range(['#DE4764', '#8DA650', '#E6EC9C']);
    }

    // Render the grid plot
    render(detailedData) {
        this.data = detailedData;
        console.log('Rendering grid plot with detailed data:', detailedData.length, 'items');

        // Clear previous grid
        this.gridGroup.selectAll('*').remove();

        this.createTimeGrid();
        this.createAxes();
        this.createLabels();
    }

    createTimeGrid() {
        // Group data by timeline
        const withKidData = this.data.filter(d => d.timeline === 'withKid');
        const withoutKidData = this.data.filter(d => d.timeline === 'withoutKid');
        
        // Create grid layout
        const gridWidth = Math.min(this.innerWidth / 2 - 20, 300); // Max width per timeline
        const cellsPerRow = Math.floor(gridWidth / (this.cellSize + this.cellPadding));
        
        // Calculate grid dimensions
        const totalCells = withKidData.length;
        const numRows = Math.ceil(totalCells / cellsPerRow);
        
        console.log(`Grid layout: ${cellsPerRow} cells per row, ${numRows} rows`);

        // Create grids for both timelines
        this.createTimelineGrid(withKidData, 0, gridWidth, cellsPerRow, 'With Kid');
        this.createTimelineGrid(withoutKidData, gridWidth + 40, gridWidth, cellsPerRow, 'Without Kid');
    }

    createTimelineGrid(data, xOffset, gridWidth, cellsPerRow, label) {
        // Create group for this timeline
        const timelineGroup = this.gridGroup.append('g')
            .attr('class', `timeline-grid timeline-${data[0].timeline}`)
            .attr('transform', `translate(${xOffset}, 40)`);

        // Add timeline label
        timelineGroup.append('text')
            .attr('class', 'timeline-title')
            .attr('x', gridWidth / 2)
            .attr('y', -20)
            .style('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(label);

        // Create cells
        const cells = timelineGroup.selectAll('.grid-cell')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'grid-cell')
            .attr('x', (d, i) => (i % cellsPerRow) * (this.cellSize + this.cellPadding))
            .attr('y', (d, i) => Math.floor(i / cellsPerRow) * (this.cellSize + this.cellPadding))
            .attr('width', this.cellSize)
            .attr('height', this.cellSize)
            .attr('fill', d => this.colorScale(d.category))
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .style('opacity', 0) // Start invisible for animation
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());

        // Animate cells appearing
        cells.transition()
            .duration(1500)
            .delay((d, i) => i * 20) // Stagger the animation
            .style('opacity', 1);

        // Add time labels every hour
        const hourLabels = [];
        for (let hour = 4; hour < 24; hour += 4) {
            const hourData = data.find(d => d.hour === hour && d.minute === 0);
            if (hourData) {
                const index = data.indexOf(hourData);
                hourLabels.push({
                    hour: hour,
                    index: index,
                    x: (index % cellsPerRow) * (this.cellSize + this.cellPadding),
                    y: Math.floor(index / cellsPerRow) * (this.cellSize + this.cellPadding)
                });
            }
        }

        // Add hour labels
        timelineGroup.selectAll('.hour-label')
            .data(hourLabels)
            .enter()
            .append('text')
            .attr('class', 'hour-label')
            .attr('x', d => d.x + this.cellSize / 2)
            .attr('y', d => d.y - 5)
            .style('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .style('opacity', 0)
            .text(d => `${d.hour}:00`)
            .transition()
            .delay(1000)
            .duration(500)
            .style('opacity', 1);
    }

    createAxes() {
        // Create legend
        this.createLegend();
    }

    createLegend() {
        const legendGroup = this.gridGroup.append('g')
            .attr('class', 'grid-legend')
            .attr('transform', `translate(0, ${this.innerHeight - 40})`);

        const categories = ['Self', 'Work', 'Kid'];
        const legendItems = legendGroup.selectAll('.legend-item')
            .data(categories)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(${i * 120}, 0)`);

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => this.colorScale(d))
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);

        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 6)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', '#333')
            .text(d => d);
    }

    createLabels() {
        // Add title
        this.gridGroup.append('text')
            .attr('class', 'grid-title')
            .attr('x', this.innerWidth / 2)
            .attr('y', -30)
            .style('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Detailed Time Distribution (Each block = 15 minutes)');

        // Add description
        this.gridGroup.append('text')
            .attr('class', 'grid-description')
            .attr('x', this.innerWidth / 2)
            .attr('y', -10)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('From 4:00 AM to midnight, reading left to right, top to bottom');
    }

    showTooltip(event, d) {
        const content = `
            <strong>Time:</strong> ${d.time}<br/>
            <strong>Activity:</strong> ${d.activity}<br/>
            <strong>Category:</strong> ${d.category}<br/>
            <strong>Duration:</strong> 15 minutes
        `;

        this.tooltip
            .html(content)
            .classed('visible', true)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    hideTooltip() {
        this.tooltip.classed('visible', false);
    }

    // Show the grid plot
    show() {
        this.isVisible = true;
        this.gridGroup
            .transition()
            .duration(1000)
            .style('opacity', 1);
    }

    // Hide the grid plot
    hide() {
        this.isVisible = false;
        this.gridGroup
            .transition()
            .duration(500)
            .style('opacity', 0);
    }

    // Transform from stacked chart to grid
    transformFromChart(chartRectangles) {
        console.log('Transforming from chart to grid...');
        
        // First, hide the chart
        // Then show the grid with animation
        setTimeout(() => {
            this.show();
        }, 500);
    }

    // Transform back to stacked chart
    transformToChart() {
        console.log('Transforming from grid to chart...');
        this.hide();
    }
}

// Global instance - will be initialized in main.js
