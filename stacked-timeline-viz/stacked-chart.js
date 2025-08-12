// Stacked column chart implementation
class StackedChart {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.data = null;
        this.svg = null;
        this.chartGroup = null;
        
        // Chart dimensions
        this.margin = { top: 40, right: 40, bottom: 80, left: 60 };
        this.width = 800;
        this.height = 500;
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        // Scales
        this.xScale = null;
        this.yScale = null;
        this.colorScale = null;
        
        // Animation state
        this.isTransformed = false;
        
        this.init();
    }

    init() {
        // Create SVG
        this.svg = this.container
            .attr('width', this.width)
            .attr('height', this.height);

        // Create main chart group
        this.chartGroup = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip');

        this.setupScales();
    }

    setupScales() {
        // X scale for the two columns (With Kid, Without Kid)
        this.xScale = d3.scaleBand()
            .domain(['withKid', 'withoutKid'])
            .range([0, this.innerWidth])
            .padding(0.3);

        // Y scale for hours (0 to 24)
        this.yScale = d3.scaleLinear()
            .domain([0, 24])
            .range([this.innerHeight, 0]);

        // Color scale
        this.colorScale = d3.scaleOrdinal()
            .domain(['Self', 'Work', 'Kid'])
            .range(['#DE4764', '#8DA650', '#E6EC9C']);
    }

    // Render the stacked chart
    render(data) {
        this.data = data;
        console.log('Rendering stacked chart with data:', data);

        // Clear previous chart
        this.chartGroup.selectAll('*').remove();

        // Create stacks
        this.createStackedColumns();
        this.createAxes();
        this.createLabels();
    }

    createStackedColumns() {
        const categories = ['Self', 'Work', 'Kid'];
        
        // Create stack generator
        const stack = d3.stack()
            .keys(categories)
            .value((d, key) => {
                const category = d.categories.find(cat => cat.category === key);
                return category ? category.hours : 0;
            });

        const stackedData = stack(this.data);
        console.log('Stacked data:', stackedData);

        // Create groups for each category
        const groups = this.chartGroup.selectAll('.stack-group')
            .data(stackedData)
            .enter()
            .append('g')
            .attr('class', 'stack-group')
            .attr('fill', d => this.colorScale(d.key));

        // Create rectangles for each segment
        const rects = groups.selectAll('.stack-segment')
            .data(d => d)
            .enter()
            .append('rect')
            .attr('class', 'stack-segment column')
            .attr('x', d => this.xScale(d.data.timeline))
            .attr('width', this.xScale.bandwidth())
            .attr('y', this.innerHeight) // Start from bottom for animation
            .attr('height', 0) // Start with 0 height for animation
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());

        // Animate rectangles
        rects.transition()
            .duration(1000)
            .delay((d, i) => i * 100)
            .attr('y', d => this.yScale(d[1]))
            .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]));
    }

    createAxes() {
        // X axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d => d === 'withKid' ? 'With Kid' : 'Without Kid');

        this.chartGroup.append('g')
            .attr('class', 'x-axis axis')
            .attr('transform', `translate(0, ${this.innerHeight})`)
            .call(xAxis);

        // Y axis
        const yAxis = d3.axisLeft(this.yScale)
            .tickFormat(d => d + 'h');

        this.chartGroup.append('g')
            .attr('class', 'y-axis axis')
            .call(yAxis);

        // Y axis label
        this.chartGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -this.innerHeight / 2)
            .style('text-anchor', 'middle')
            .text('Hours per Day');
    }

    createLabels() {
        // Add column labels
        this.chartGroup.selectAll('.column-label')
            .data(this.data)
            .enter()
            .append('text')
            .attr('class', 'column-label')
            .attr('x', d => this.xScale(d.timeline) + this.xScale.bandwidth() / 2)
            .attr('y', -15)
            .text(d => d.label);

        // Add total hours on top of each column
        this.chartGroup.selectAll('.total-label')
            .data(this.data)
            .enter()
            .append('text')
            .attr('class', 'total-label')
            .attr('x', d => this.xScale(d.timeline) + this.xScale.bandwidth() / 2)
            .attr('y', d => this.yScale(d.totalHours) - 5)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => `${d.totalHours.toFixed(1)}h total`);
    }

    showTooltip(event, d) {
        const category = d3.select(event.target.parentNode).datum().key;
        const categoryData = d.data.categories.find(cat => cat.category === category);
        
        if (!categoryData) return;

        const content = `
            <strong>${d.data.label}</strong><br/>
            <strong>${category}:</strong> ${dataProcessor.formatTime(categoryData.hours)}<br/>
            <strong>Percentage:</strong> ${dataProcessor.formatPercentage(categoryData.percentage)}<br/>
            <strong>Time slots:</strong> ${categoryData.count} × 15min
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

    // Prepare for transformation to grid
    prepareForTransformation() {
        this.isTransformed = true;
        
        // Fade out axes and labels
        this.chartGroup.selectAll('.axis, .column-label, .total-label')
            .transition()
            .duration(500)
            .style('opacity', 0);

        // Get current rectangles for transformation
        return this.chartGroup.selectAll('.stack-segment').nodes();
    }

    // Reset to original state
    reset() {
        this.isTransformed = false;
        
        // Restore axes and labels
        this.chartGroup.selectAll('.axis, .column-label, .total-label')
            .transition()
            .duration(500)
            .style('opacity', 1);
    }

    // Get rectangle positions for grid transformation
    getRectangleData() {
        const rectangles = [];
        
        this.chartGroup.selectAll('.stack-segment').each(function(d) {
            const rect = d3.select(this);
            const category = d3.select(this.parentNode).datum().key;
            const categoryData = d.data.categories.find(cat => cat.category === category);
            
            rectangles.push({
                element: this,
                x: parseFloat(rect.attr('x')),
                y: parseFloat(rect.attr('y')),
                width: parseFloat(rect.attr('width')),
                height: parseFloat(rect.attr('height')),
                category: category,
                timeline: d.data.timeline,
                data: categoryData,
                color: rect.attr('fill')
            });
        });
        
        return rectangles;
    }

    // Hide the chart for grid transformation
    hide() {
        this.chartGroup.style('opacity', 0);
    }

    // Show the chart
    show() {
        this.chartGroup.style('opacity', 1);
    }
}

// Global instance - will be initialized in main.js
