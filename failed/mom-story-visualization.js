// Working Mom Story Visualization
// Creates the main D3.js timeline visualization

let currentStepIndex = 0;
let totalSteps = 0;
let storyContainer = null;
let progressIndicator = null;

// Initialize visualization when data is ready
window.addEventListener('storyDataReady', function(event) {
    const { activityBlocks } = event.detail;
    totalSteps = activityBlocks.length;
    
    console.log('Initializing visualization with', totalSteps, 'story steps');
    
    createStorySteps(activityBlocks);
    createProgressIndicator();
    showStep(0);
});

// Create story step elements
function createStorySteps(blocks) {
    storyContainer = d3.select('#story-container');
    
    // Create a step for each activity block
    const steps = storyContainer.selectAll('.story-step')
        .data(blocks)
        .enter()
        .append('div')
        .attr('class', 'story-step')
        .attr('data-step', (d, i) => i);
    
    // Left side (With Kid)
    const leftSides = steps.append('div')
        .attr('class', 'timeline-side left');
    
    leftSides.append('div')
        .attr('class', 'side-header')
        .text('With Children');
    
    // Create left time blocks
    leftSides.append('div')
        .attr('class', d => `time-block ${d.withKidCategory.toLowerCase()}`)
        .attr('data-category', d => d.withKidCategory)
        .style('height', d => Math.max(60, d.duration / 15 * 20) + 'px')
        .text(d => d.timeRange);
    
    // Left activity annotations
    leftSides.append('div')
        .attr('class', 'activity-annotation left')
        .html(d => `<strong>${d.withKidActivity}</strong><br><small>${d.durationText}</small>`);
    
    // Center timeline
    const centers = steps.append('div')
        .attr('class', 'center-timeline');
    
    centers.append('div')
        .attr('class', 'timeline-line');
    
    centers.append('div')
        .attr('class', 'time-indicator')
        .text(d => d.timeRange);
    
    // Right side (Without Kid)
    const rightSides = steps.append('div')
        .attr('class', 'timeline-side right');
    
    rightSides.append('div')
        .attr('class', 'side-header')
        .text('Without Children');
    
    // Create right time blocks
    rightSides.append('div')
        .attr('class', d => `time-block ${d.withoutKidCategory.toLowerCase()}`)
        .attr('data-category', d => d.withoutKidCategory)
        .style('height', d => Math.max(60, d.duration / 15 * 20) + 'px')
        .text(d => d.timeRange);
    
    // Right activity annotations
    rightSides.append('div')
        .attr('class', 'activity-annotation right')
        .html(d => `<strong>${d.withoutKidActivity}</strong><br><small>${d.durationText}</small>`);
}

// Create progress indicator
function createProgressIndicator() {
    if (!activityBlocks || activityBlocks.length === 0) return;
    
    progressIndicator = d3.select('body')
        .append('div')
        .attr('class', 'progress-indicator');
    
    const dots = progressIndicator.selectAll('.progress-dot')
        .data(activityBlocks)
        .enter()
        .append('div')
        .attr('class', 'progress-dot')
        .attr('data-step', (d, i) => i)
        .on('click', function(event, d, i) {
            showStep(i);
            scrollToStep(i);
        });
}

// Show specific step
function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= totalSteps) return;
    
    currentStepIndex = stepIndex;
    
    // Update all story steps
    d3.selectAll('.story-step').each(function(d, i) {
        const step = d3.select(this);
        const timeBlocks = step.selectAll('.time-block');
        const annotations = step.selectAll('.activity-annotation');
        
        if (i === stepIndex) {
            // Current step - active
            timeBlocks.classed('active', true)
                .classed('past', false)
                .classed('future', false);
            annotations.classed('visible', true);
        } else if (i < stepIndex) {
            // Past steps - smaller
            timeBlocks.classed('active', false)
                .classed('past', true)
                .classed('future', false);
            annotations.classed('visible', false);
        } else {
            // Future steps - very small
            timeBlocks.classed('active', false)
                .classed('past', false)
                .classed('future', true);
            annotations.classed('visible', false);
        }
    });
    
    // Update progress indicator
    if (progressIndicator) {
        progressIndicator.selectAll('.progress-dot')
            .classed('active', (d, i) => i === stepIndex);
    }
    
    // Check if we've reached the end
    if (stepIndex === totalSteps - 1) {
        setTimeout(() => {
            triggerFinalTransformation();
        }, 1000);
    }
}

// Scroll to specific step
function scrollToStep(stepIndex) {
    const targetStep = document.querySelector(`[data-step="${stepIndex}"]`);
    if (targetStep) {
        targetStep.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Trigger final transformation to grid
function triggerFinalTransformation() {
    console.log('Triggering final transformation to grid');
    
    // Create flying animation
    createFlyingAnimation();
    
    // Scroll to final grid section
    setTimeout(() => {
        document.getElementById('final-grid').scrollIntoView({
            behavior: 'smooth'
        });
    }, 500);
    
    // Create final grid visualization
    setTimeout(() => {
        createFinalGrid();
    }, 2000);
}

// Create flying animation from timeline to grid
function createFlyingAnimation() {
    const flyingContainer = d3.select('body')
        .append('div')
        .style('position', 'fixed')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100vw')
        .style('height', '100vh')
        .style('pointer-events', 'none')
        .style('z-index', '9999');
    
    // Get current time blocks
    const currentBlocks = d3.selectAll('.story-step .time-block.active');
    const gridContainer = document.getElementById('grid-container');
    const gridRect = gridContainer.getBoundingClientRect();
    
    currentBlocks.each(function(d, i) {
        const block = this;
        const blockRect = block.getBoundingClientRect();
        
        // Create flying element
        const flyer = flyingContainer.append('div')
            .style('position', 'absolute')
            .style('left', blockRect.left + 'px')
            .style('top', blockRect.top + 'px')
            .style('width', blockRect.width + 'px')
            .style('height', blockRect.height + 'px')
            .style('background-color', window.getComputedStyle(block).backgroundColor)
            .style('border-radius', '12px')
            .style('opacity', '0.8');
        
        // Calculate target position in grid
        const targetX = gridRect.left + (i % 4) * 100;
        const targetY = gridRect.top + Math.floor(i / 4) * 50;
        
        // Animate to grid position
        flyer.transition()
            .delay(i * 100)
            .duration(1500)
            .ease(d3.easeCubicInOut)
            .style('left', targetX + 'px')
            .style('top', targetY + 'px')
            .style('width', '80px')
            .style('height', '40px')
            .style('opacity', '1')
            .on('end', function() {
                if (i === currentBlocks.size() - 1) {
                    // Remove flying container after animation
                    setTimeout(() => {
                        flyingContainer.remove();
                    }, 500);
                }
            });
    });
}

// Create final grid visualization
function createFinalGrid() {
    if (!activityBlocks || activityBlocks.length === 0) return;
    
    console.log('Creating final grid visualization');
    
    const gridContainer = d3.select('#grid-container');
    
    // Calculate time distribution
    const withKidStats = calculateTimeDistribution('withKid');
    const withoutKidStats = calculateTimeDistribution('withoutKid');
    
    // Create side-by-side grids
    const gridWrapper = gridContainer.append('div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('gap', '40px')
        .style('flex-wrap', 'wrap');
    
    // With Kids Grid
    createSingleGrid(gridWrapper, withKidStats, 'With Children', 'withKid');
    
    // Without Kids Grid
    createSingleGrid(gridWrapper, withoutKidStats, 'Without Children', 'withoutKid');
    
    // Add summary statistics
    createSummaryStats(gridContainer, withKidStats, withoutKidStats);
}

// Calculate time distribution by category
function calculateTimeDistribution(scenario) {
    const categoryKey = scenario === 'withKid' ? 'withKidCategory' : 'withoutKidCategory';
    const activityKey = scenario === 'withKid' ? 'withKidActivity' : 'withoutKidActivity';
    
    const stats = {
        Self: { time: 0, activities: [] },
        Kid: { time: 0, activities: [] },
        Work: { time: 0, activities: [] },
        total: 0
    };
    
    activityBlocks.forEach(block => {
        const category = block[categoryKey];
        const activity = block[activityKey];
        const duration = block.duration;
        
        if (stats[category]) {
            stats[category].time += duration;
            stats[category].activities.push({ activity, duration });
        }
        stats.total += duration;
    });
    
    // Calculate percentages
    Object.keys(stats).forEach(key => {
        if (key !== 'total' && stats[key]) {
            stats[key].percentage = Math.round((stats[key].time / stats.total) * 100);
            stats[key].hours = Math.round(stats[key].time / 60 * 10) / 10;
        }
    });
    
    return stats;
}

// Create single grid chart
function createSingleGrid(container, stats, title, scenario) {
    const gridSection = container.append('div')
        .attr('class', 'grid-section');
    
    gridSection.append('h3')
        .attr('class', 'grid-title')
        .text(title);
    
    const svg = gridSection.append('svg')
        .attr('class', 'grid-chart')
        .attr('width', 400)
        .attr('height', 300);
    
    // Create pie chart
    const pie = d3.pie()
        .value(d => d.time)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(60)
        .outerRadius(120);
    
    const data = ['Self', 'Kid', 'Work'].map(category => ({
        category,
        time: stats[category].time,
        percentage: stats[category].percentage,
        color: getCategoryColor(category)
    })).filter(d => d.time > 0);
    
    const g = svg.append('g')
        .attr('transform', 'translate(200, 150)');
    
    const slices = g.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'slice');
    
    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .style('opacity', 0.9)
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 1);
            
            // Show tooltip
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0,0,0,0.8)')
                .style('color', 'white')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '10000')
                .html(`${d.data.category}: ${d.data.percentage}%<br>${d.data.time} minutes`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 0.9);
            d3.selectAll('.tooltip').remove();
        });
    
    // Add labels
    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#333')
        .text(d => d.data.percentage > 5 ? `${d.data.percentage}%` : '');
}

// Create summary statistics
function createSummaryStats(container, withKidStats, withoutKidStats) {
    const summarySection = container.append('div')
        .style('margin-top', '40px')
        .style('text-align', 'center');
    
    summarySection.append('h3')
        .style('margin-bottom', '20px')
        .text('Time Distribution Summary');
    
    const statsTable = summarySection.append('div')
        .style('display', 'inline-block')
        .style('text-align', 'left');
    
    const categories = ['Self', 'Kid', 'Work'];
    
    categories.forEach(category => {
        const row = statsTable.append('div')
            .style('margin', '10px 0')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '20px');
        
        row.append('div')
            .style('width', '60px')
            .style('font-weight', '600')
            .text(category + ':');
        
        row.append('div')
            .style('width', '120px')
            .text(`With: ${withKidStats[category].percentage}% (${withKidStats[category].hours}h)`);
        
        row.append('div')
            .style('width', '120px')
            .text(`Without: ${withoutKidStats[category].percentage}% (${withoutKidStats[category].hours}h)`);
        
        row.append('div')
            .style('width', '20px')
            .style('height', '20px')
            .style('background-color', getCategoryColor(category))
            .style('border-radius', '3px');
    });
}

// Navigation functions
function nextStep() {
    if (currentStepIndex < totalSteps - 1) {
        showStep(currentStepIndex + 1);
        scrollToStep(currentStepIndex);
    }
}

function previousStep() {
    if (currentStepIndex > 0) {
        showStep(currentStepIndex - 1);
        scrollToStep(currentStepIndex);
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowDown':
        case ' ':
            event.preventDefault();
            nextStep();
            break;
        case 'ArrowUp':
            event.preventDefault();
            previousStep();
            break;
    }
});
