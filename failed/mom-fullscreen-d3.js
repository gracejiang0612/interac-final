// D3 Fullscreen Timeline Visualization

let currentTimeBlockIndex = 0;
const totalTimeBlocks = timelineData.length;

// Set up dimensions
const timelineHeight = 500;
const timelineWidth = 60;
const blockHeight = timelineHeight / 24; // 24 hours

// Create SVG for left timeline
const leftSvg = d3.select("#left-timeline")
    .append("svg")
    .attr("width", timelineWidth)
    .attr("height", timelineHeight);

// Create SVG for right timeline  
const rightSvg = d3.select("#right-timeline")
    .append("svg")
    .attr("width", timelineWidth)
    .attr("height", timelineHeight);

// Create SVG for center time axis
const centerSvg = d3.select("#time-axis")
    .append("svg")
    .attr("width", 200)
    .attr("height", timelineHeight);

// Time scale
const timeScale = d3.scaleLinear()
    .domain([0, 24 * 60]) // 0 to 1440 minutes (24 hours)
    .range([0, timelineHeight]);

// Draw time axis
const timeAxis = d3.axisRight(timeScale)
    .tickFormat(d => {
        const hours = Math.floor(d / 60);
        const period = hours < 12 ? 'AM' : 'PM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours} ${period}`;
    })
    .tickValues(d3.range(0, 24 * 60 + 1, 60)) // Every hour
    .tickSize(5);

centerSvg.append("g")
    .attr("class", "time-axis")
    .attr("transform", "translate(50, 0)")
    .call(timeAxis)
    .selectAll("text")
    .style("font-size", "11px")
    .style("fill", "#666");

// Initialize timeline blocks arrays
let leftTimelineBlocks = [];
let rightTimelineBlocks = [];

// Function to create a timeline block
function createTimelineBlock(svg, data, side) {
    const blockHeight = 15 / 60 * timelineHeight / 24; // 15 minutes in pixels
    const yPosition = timeScale(data.totalMinutes);
    
    const block = svg.append("rect")
        .attr("class", `timeline-block ${data[side + 'Category'].toLowerCase()}`)
        .attr("x", 0)
        .attr("y", yPosition)
        .attr("width", timelineWidth)
        .attr("height", blockHeight)
        .attr("fill", getCategoryColor(data[side + 'Category']))
        .style("opacity", 0.3)
        .style("transform", "scale(1, 0)")
        .style("transform-origin", "bottom");
    
    return block;
}

// Function to update the current time display
function updateTimeDisplay(index) {
    const timeData = timelineData[index];
    d3.select("#current-time").text(timeData.formattedTime);
}

// Function to update activity descriptions
function updateActivityDescriptions(index) {
    const timeData = timelineData[index];
    
    d3.select("#left-activity")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this)
                .html(timeData.withKidActivity)
                .transition()
                .duration(300)
                .style("opacity", 1);
        });
    
    d3.select("#right-activity")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this)
                .html(timeData.withoutKidActivity)
                .transition()
                .duration(300)
                .style("opacity", 1);
        });
}

// Function to animate to a specific time block
function animateToTimeBlock(targetIndex) {
    if (targetIndex < 0 || targetIndex >= totalTimeBlocks) return;
    
    const timeData = timelineData[targetIndex];
    
    // Update time display
    updateTimeDisplay(targetIndex);
    
    // Update activity descriptions
    updateActivityDescriptions(targetIndex);
    
    // Create new blocks if they don't exist
    if (targetIndex >= leftTimelineBlocks.length) {
        for (let i = leftTimelineBlocks.length; i <= targetIndex; i++) {
            const data = timelineData[i];
            
            // Create left block
            const leftBlock = createTimelineBlock(leftSvg, data, 'withKid');
            leftTimelineBlocks.push(leftBlock);
            
            // Create right block
            const rightBlock = createTimelineBlock(rightSvg, data, 'withoutKid');
            rightTimelineBlocks.push(rightBlock);
        }
    }
    
    // Animate all blocks
    leftTimelineBlocks.forEach((block, i) => {
        let opacity, scale, zIndex;
        
        if (i < targetIndex) {
            // Past blocks - smaller and faded
            opacity = 0.6;
            scale = "scale(1, 0.8)";
            zIndex = 1;
        } else if (i === targetIndex) {
            // Current block - large and prominent
            opacity = 1;
            scale = "scale(1, 3)";
            zIndex = 10;
        } else {
            // Future blocks - very faded
            opacity = 0.2;
            scale = "scale(1, 0.5)";
            zIndex = 1;
        }
        
        block.transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .style("opacity", opacity)
            .style("transform", scale)
            .style("z-index", zIndex);
    });
    
    // Animate right blocks
    rightTimelineBlocks.forEach((block, i) => {
        let opacity, scale, zIndex;
        
        if (i < targetIndex) {
            opacity = 0.6;
            scale = "scale(1, 0.8)";
            zIndex = 1;
        } else if (i === targetIndex) {
            opacity = 1;
            scale = "scale(1, 3)";
            zIndex = 10;
        } else {
            opacity = 0.2;
            scale = "scale(1, 0.5)";
            zIndex = 1;
        }
        
        block.transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .style("opacity", opacity)
            .style("transform", scale)
            .style("z-index", zIndex);
    });
    
    currentTimeBlockIndex = targetIndex;
}

// Function to move to next time block
function nextTimeBlock() {
    if (currentTimeBlockIndex < totalTimeBlocks - 1) {
        animateToTimeBlock(currentTimeBlockIndex + 1);
    }
}

// Function to move to previous time block
function previousTimeBlock() {
    if (currentTimeBlockIndex > 0) {
        animateToTimeBlock(currentTimeBlockIndex - 1);
    }
}

// Function to jump to specific time block
function jumpToTimeBlock(index) {
    animateToTimeBlock(index);
}

// Initialize with first time block
animateToTimeBlock(0);

// Add visual enhancements
function addVisualEnhancements() {
    // Add subtle animation to current time display
    setInterval(() => {
        d3.select("#current-time")
            .transition()
            .duration(100)
            .style("transform", "scale(1.05)")
            .transition()
            .duration(100)
            .style("transform", "scale(1)");
    }, 2000);
    
    // Add glow effect to current blocks
    const style = document.createElement('style');
    style.textContent = `
        .timeline-block.current {
            filter: drop-shadow(0 0 10px rgba(164, 156, 252, 0.6));
        }
    `;
    document.head.appendChild(style);
}

// Call visual enhancements
addVisualEnhancements();

// Grid Plot Functionality
let gridInitialized = false;

function createGridVisualization() {
    if (gridInitialized) return;
    gridInitialized = true;
    
    console.log("Creating grid visualization...");
    
    // Grid dimensions
    const gridMargin = {top: 40, right: 20, bottom: 60, left: 60};
    const gridWidth = 560 - gridMargin.left - gridMargin.right;
    const gridHeight = 560 - gridMargin.top - gridMargin.bottom;
    
    // Calculate grid layout (24 hours = 24 rows, 4 quarters = 4 columns)
    const cellsPerHour = 4; // 15-minute intervals
    const hoursPerDay = 24;
    const cellWidth = gridWidth / cellsPerHour;
    const cellHeight = gridHeight / hoursPerDay;
    
    // Create grid tooltip
    const gridTooltip = d3.select("body").append("div")
        .attr("class", "grid-tooltip")
        .style("opacity", 0);
    
    // Create left grid (with kids)
    createSingleGrid("#left-grid", "withKid", "With Children");
    
    // Create right grid (without kids)  
    createSingleGrid("#right-grid", "withoutKid", "Without Children");
    
    // Add legend
    createGridLegend();
    
    function createSingleGrid(containerId, dataKey, title) {
        const container = d3.select(containerId);
        
        const svg = container.append("svg")
            .attr("width", gridWidth + gridMargin.left + gridMargin.right)
            .attr("height", gridHeight + gridMargin.top + gridMargin.bottom);
            
        const g = svg.append("g")
            .attr("transform", `translate(${gridMargin.left},${gridMargin.top})`);
        
        // Process data for grid
        const gridData = timelineData.map((d, i) => {
            const hour = Math.floor(i / 4);
            const quarter = i % 4;
            const category = dataKey === "withKid" ? d.withKidCategory : d.withoutKidCategory;
            const activity = dataKey === "withKid" ? d.withKidActivity : d.withoutKidActivity;
            
            return {
                hour: hour,
                quarter: quarter,
                x: quarter * cellWidth,
                y: hour * cellHeight,
                category: category,
                activity: activity,
                time: d.formattedTime,
                index: i
            };
        });
        
        // Create cells with staggered animation
        const cells = g.selectAll(".grid-cell")
            .data(gridData)
            .enter()
            .append("rect")
            .attr("class", "grid-cell")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("fill", d => getCategoryColor(d.category))
            .style("opacity", 0)
            .on("mouseover", function(event, d) {
                gridTooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                gridTooltip.html(`
                    <strong>${d.time}</strong><br/>
                    <strong>Category:</strong> ${d.category}<br/>
                    <strong>Activity:</strong> ${d.activity}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                gridTooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            });
        
        // Animate cells in waves
        cells.transition()
            .delay((d, i) => i * 50) // 50ms delay between each cell
            .duration(600)
            .ease(d3.easeCubicOut)
            .style("opacity", 1)
            .attr("transform", "scale(1)")
            .on("start", function() {
                d3.select(this).attr("transform", "scale(0)");
            });
        
        // Add time labels (hours)
        const hourLabels = g.selectAll(".hour-label")
            .data(d3.range(24))
            .enter()
            .append("text")
            .attr("class", "grid-axis")
            .attr("x", -10)
            .attr("y", d => d * cellHeight + cellHeight/2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => {
                const hour = d === 0 ? 12 : d > 12 ? d - 12 : d;
                const period = d < 12 ? 'AM' : 'PM';
                return `${hour} ${period}`;
            })
            .style("opacity", 0);
        
        // Add quarter labels (15-min intervals)
        const quarterLabels = g.selectAll(".quarter-label")
            .data([":00", ":15", ":30", ":45"])
            .enter()
            .append("text")
            .attr("class", "grid-axis")
            .attr("x", (d, i) => i * cellWidth + cellWidth/2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text(d => d)
            .style("opacity", 0);
        
        // Animate labels
        hourLabels.transition()
            .delay(1000)
            .duration(800)
            .style("opacity", 1);
        
        quarterLabels.transition()
            .delay(1200)
            .duration(800)
            .style("opacity", 1);
        
        // Add title
        svg.append("text")
            .attr("class", "grid-axis-label")
            .attr("x", (gridWidth + gridMargin.left + gridMargin.right) / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .text(title)
            .style("opacity", 0)
            .transition()
            .delay(1400)
            .duration(600)
            .style("opacity", 1);
    }
    
    function createGridLegend() {
        const legendContainer = d3.select("#grid-visualization-container")
            .append("div")
            .attr("class", "grid-legend")
            .style("opacity", 0);
        
        const categories = [
            {name: "Personal Time", color: "#A49CFC"},
            {name: "Child Care", color: "#5126AE"},
            {name: "Work Activities", color: "#00119F"}
        ];
        
        const legendItems = legendContainer.selectAll(".grid-legend-item")
            .data(categories)
            .enter()
            .append("div")
            .attr("class", "grid-legend-item");
        
        legendItems.append("div")
            .attr("class", "grid-legend-color")
            .style("background-color", d => d.color);
        
        legendItems.append("span")
            .text(d => d.name);
        
        // Animate legend
        legendContainer.transition()
            .delay(2000)
            .duration(800)
            .style("opacity", 1);
    }
}

// Function to trigger grid transformation
function transformToGrid() {
    console.log("Transforming timeline to grid...");
    
    // Hide timeline elements with animation
    d3.select("#timeline-container .main-content")
        .transition()
        .duration(1000)
        .style("opacity", 0.3);
    
    // Wait a bit then create grid
    setTimeout(() => {
        createGridVisualization();
    }, 500);
}
