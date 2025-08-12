// Improved D3 Fullscreen Timeline with Flying Animation

let currentActivityGroupIndex = 0;
const totalActivityGroups = activityGroups.length;
let timelineBlocks = [];

// Set up dimensions with better alignment
const timelineHeight = 500;
const timelineWidth = 60;
const centerTimelineWidth = 200;

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
    .attr("width", centerTimelineWidth)
    .attr("height", timelineHeight);

// Time scale - 24 hours mapped to timeline height
const timeScale = d3.scaleLinear()
    .domain([0, 24 * 60]) // 0 to 1440 minutes (24 hours)
    .range([0, timelineHeight]);

// Draw center time axis
const timeAxis = d3.axisRight(timeScale)
    .tickFormat(d => {
        const hours = Math.floor(d / 60);
        const period = hours < 12 ? 'AM' : 'PM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours} ${period}`;
    })
    .tickValues(d3.range(0, 24 * 60 + 1, 60)) // Every hour
    .tickSize(10);

centerSvg.append("g")
    .attr("class", "time-axis")
    .attr("transform", `translate(${centerTimelineWidth/2}, 0)`)
    .call(timeAxis)
    .selectAll("text")
    .style("font-size", "11px")
    .style("fill", "#666");

// Add center timeline line
centerSvg.append("line")
    .attr("class", "center-timeline-line")
    .attr("x1", centerTimelineWidth/2)
    .attr("x2", centerTimelineWidth/2)
    .attr("y1", 0)
    .attr("y2", timelineHeight)
    .attr("stroke", "#5126AE")
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.3);

// Function to create timeline blocks for an activity group
function createTimelineBlocksForGroup(group, side) {
    const svg = side === 'left' ? leftSvg : rightSvg;
    const categoryKey = side === 'left' ? 'withKidCategory' : 'withoutKidCategory';
    
    // Calculate block position and height
    const startMinutes = group.timeBlocks[0].totalMinutes;
    const endMinutes = group.timeBlocks[group.timeBlocks.length - 1].totalMinutes + 15; // Add 15 min for last block
    const blockHeight = timeScale(endMinutes) - timeScale(startMinutes);
    const yPosition = timeScale(startMinutes);
    
    const block = svg.append("rect")
        .attr("class", `timeline-block ${group[categoryKey].toLowerCase()}`)
        .attr("x", 0)
        .attr("y", yPosition)
        .attr("width", timelineWidth)
        .attr("height", blockHeight)
        .attr("fill", getCategoryColor(group[categoryKey]))
        .style("opacity", 0.3)
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .attr("data-group-index", currentActivityGroupIndex)
        .attr("data-side", side);
    
    return {
        block: block,
        group: group,
        startMinutes: startMinutes,
        endMinutes: endMinutes,
        yPosition: yPosition,
        blockHeight: blockHeight
    };
}

// Function to update the current time display
function updateTimeDisplay(groupIndex) {
    const group = activityGroups[groupIndex];
    const timeRange = group.duration === 1 ? 
        formatTime(group.startTime) : 
        `${formatTime(group.startTime)} - ${formatTime(group.endTime)}`;
    d3.select("#current-time").text(timeRange);
}

// Function to update activity descriptions
function updateActivityDescriptions(groupIndex) {
    const group = activityGroups[groupIndex];
    
    d3.select("#left-activity")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this)
                .html(`<strong>${formatDuration(group.duration)}</strong><br/>${group.withKidActivity}`)
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
                .html(`<strong>${formatDuration(group.duration)}</strong><br/>${group.withoutKidActivity}`)
                .transition()
                .duration(300)
                .style("opacity", 1);
        });
}

// Function to animate to a specific activity group
function animateToActivityGroup(targetIndex) {
    if (targetIndex < 0 || targetIndex >= totalActivityGroups) return;
    
    const group = activityGroups[targetIndex];
    
    // Update time display and descriptions
    updateTimeDisplay(targetIndex);
    updateActivityDescriptions(targetIndex);
    
    // Create new blocks if they don't exist
    if (targetIndex >= timelineBlocks.length) {
        for (let i = timelineBlocks.length; i <= targetIndex; i++) {
            const groupData = activityGroups[i];
            
            const leftBlockData = createTimelineBlocksForGroup(groupData, 'left');
            const rightBlockData = createTimelineBlocksForGroup(groupData, 'right');
            
            timelineBlocks.push({
                left: leftBlockData,
                right: rightBlockData,
                group: groupData
            });
        }
    }
    
    // Animate all blocks
    timelineBlocks.forEach((blockData, i) => {
        let opacity, scale, zIndex;
        
        if (i < targetIndex) {
            // Past blocks - smaller and faded
            opacity = 0.4;
            scale = "scale(1, 0.7)";
            zIndex = 1;
        } else if (i === targetIndex) {
            // Current block - large and prominent
            opacity = 1;
            scale = "scale(1, 1.2)";
            zIndex = 10;
        } else {
            // Future blocks - very faded
            opacity = 0.15;
            scale = "scale(1, 0.5)";
            zIndex = 1;
        }
        
        // Animate left block
        blockData.left.block.transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .style("opacity", opacity)
            .style("transform", scale)
            .style("z-index", zIndex);
        
        // Animate right block
        blockData.right.block.transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .style("opacity", opacity)
            .style("transform", scale)
            .style("z-index", zIndex);
    });
    
    currentActivityGroupIndex = targetIndex;
}

// Flying animation to grid
function createFlyingAnimation() {
    console.log("Starting flying animation...");
    
    // Grid dimensions and layout
    const gridMargin = {top: 60, right: 30, bottom: 80, left: 80};
    const gridWidth = 520 - gridMargin.left - gridMargin.right;
    const gridHeight = 520 - gridMargin.top - gridMargin.bottom;
    const cellWidth = gridWidth / 4; // 4 quarters per hour
    const cellHeight = gridHeight / 24; // 24 hours
    
    // Get timeline container position
    const timelineContainer = document.querySelector("#timeline-container .main-content");
    const timelineRect = timelineContainer.getBoundingClientRect();
    
    // Get grid containers
    const leftGridContainer = document.querySelector("#left-grid");
    const rightGridContainer = document.querySelector("#right-grid");
    const leftGridRect = leftGridContainer.getBoundingClientRect();
    const rightGridRect = rightGridContainer.getBoundingClientRect();
    
    // Create temporary flying elements
    const flyingContainer = d3.select("body")
        .append("div")
        .attr("class", "flying-container")
        .style("position", "fixed")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100vw")
        .style("height", "100vh")
        .style("pointer-events", "none")
        .style("z-index", "9999");
    
    // Animate each timeline block to its grid position
    timelineData.forEach((timeData, index) => {
        const hour = Math.floor(index / 4);
        const quarter = index % 4;
        
        // Calculate grid positions
        const leftGridX = leftGridRect.left + gridMargin.left + (quarter * cellWidth);
        const leftGridY = leftGridRect.top + gridMargin.top + (hour * cellHeight);
        const rightGridX = rightGridRect.left + gridMargin.left + (quarter * cellWidth);
        const rightGridY = rightGridRect.top + gridMargin.top + (hour * cellHeight);
        
        // Create flying elements for left side
        const leftFlyer = flyingContainer.append("div")
            .style("position", "absolute")
            .style("width", "40px")
            .style("height", "10px")
            .style("background-color", getCategoryColor(timeData.withKidCategory))
            .style("left", (timelineRect.left + 50) + "px")
            .style("top", (timelineRect.top + timeScale(timeData.totalMinutes)) + "px")
            .style("border-radius", "2px")
            .style("opacity", "0.8");
        
        // Create flying elements for right side
        const rightFlyer = flyingContainer.append("div")
            .style("position", "absolute")
            .style("width", "40px")
            .style("height", "10px")
            .style("background-color", getCategoryColor(timeData.withoutKidCategory))
            .style("left", (timelineRect.right - 90) + "px")
            .style("top", (timelineRect.top + timeScale(timeData.totalMinutes)) + "px")
            .style("border-radius", "2px")
            .style("opacity", "0.8");
        
        // Animate to grid positions
        leftFlyer.transition()
            .delay(index * 30) // Stagger the animations
            .duration(1500)
            .ease(d3.easeCubicInOut)
            .style("left", leftGridX + "px")
            .style("top", leftGridY + "px")
            .style("width", cellWidth + "px")
            .style("height", cellHeight + "px")
            .on("end", function() {
                if (index === timelineData.length - 1) {
                    // Animation complete, create actual grid
                    setTimeout(() => {
                        createGridVisualization();
                        flyingContainer.remove();
                    }, 500);
                }
            });
        
        rightFlyer.transition()
            .delay(index * 30)
            .duration(1500)
            .ease(d3.easeCubicInOut)
            .style("left", rightGridX + "px")
            .style("top", rightGridY + "px")
            .style("width", cellWidth + "px")
            .style("height", cellHeight + "px");
    });
}

// Grid visualization with percentage summary
function createGridVisualization() {
    if (document.querySelector("#left-grid svg")) return; // Already created
    
    console.log("Creating final grid visualization...");
    
    // Grid dimensions
    const gridMargin = {top: 60, right: 30, bottom: 80, left: 80};
    const gridWidth = 520 - gridMargin.left - gridMargin.right;
    const gridHeight = 520 - gridMargin.top - gridMargin.bottom;
    const cellWidth = gridWidth / 4;
    const cellHeight = gridHeight / 24;
    
    // Create grid tooltip
    const gridTooltip = d3.select("body").append("div")
        .attr("class", "grid-tooltip")
        .style("opacity", 0);
    
    // Create grids
    createSingleGrid("#left-grid", "withKid", "With Children");
    createSingleGrid("#right-grid", "withoutKid", "Without Children");
    
    // Add percentage summaries
    createPercentageSummary();
    
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
        
        // Create cells
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
            .style("stroke", "#fff")
            .style("stroke-width", 1)
            .style("opacity", 0.9)
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
        
        // Add time labels
        const hourLabels = g.selectAll(".hour-label")
            .data(d3.range(24))
            .enter()
            .append("text")
            .attr("class", "grid-axis")
            .attr("x", -15)
            .attr("y", d => d * cellHeight + cellHeight/2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => {
                const hour = d === 0 ? 12 : d > 12 ? d - 12 : d;
                const period = d < 12 ? 'AM' : 'PM';
                return `${hour} ${period}`;
            });
        
        const quarterLabels = g.selectAll(".quarter-label")
            .data([":00", ":15", ":30", ":45"])
            .enter()
            .append("text")
            .attr("class", "grid-axis")
            .attr("x", (d, i) => i * cellWidth + cellWidth/2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .text(d => d);
        
        // Add title
        svg.append("text")
            .attr("class", "grid-axis-label")
            .attr("x", (gridWidth + gridMargin.left + gridMargin.right) / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .text(title);
    }
    
    function createPercentageSummary() {
        // Add percentage breakdown below grids
        const summaryContainer = d3.select("#grid-visualization-container")
            .append("div")
            .attr("class", "percentage-summary")
            .style("margin-top", "40px")
            .style("display", "flex")
            .style("justify-content", "space-around")
            .style("flex-wrap", "wrap");
        
        // With Kids percentages
        const withKidsDiv = summaryContainer.append("div")
            .attr("class", "percentage-group")
            .style("text-align", "center")
            .style("margin", "20px");
        
        withKidsDiv.append("h4")
            .style("margin-bottom", "15px")
            .style("color", "#5126AE")
            .text("With Children");
        
        const withKidsPercentages = withKidsDiv.append("div")
            .attr("class", "percentage-bars");
        
        Object.entries(categoryPercentages.withKids).forEach(([category, percentage]) => {
            if (category !== 'counts' && category !== 'total') {
                const barContainer = withKidsPercentages.append("div")
                    .style("margin", "10px 0")
                    .style("text-align", "left");
                
                barContainer.append("div")
                    .style("font-size", "14px")
                    .style("margin-bottom", "5px")
                    .text(`${category}: ${percentage}%`);
                
                barContainer.append("div")
                    .style("width", "200px")
                    .style("height", "10px")
                    .style("background-color", "#e9ecef")
                    .style("border-radius", "5px")
                    .append("div")
                    .style("width", `${percentage}%`)
                    .style("height", "100%")
                    .style("background-color", getCategoryColor(category))
                    .style("border-radius", "5px")
                    .style("transition", "width 1s ease");
            }
        });
        
        // Without Kids percentages
        const withoutKidsDiv = summaryContainer.append("div")
            .attr("class", "percentage-group")
            .style("text-align", "center")
            .style("margin", "20px");
        
        withoutKidsDiv.append("h4")
            .style("margin-bottom", "15px")
            .style("color", "#5126AE")
            .text("Without Children");
        
        const withoutKidsPercentages = withoutKidsDiv.append("div")
            .attr("class", "percentage-bars");
        
        Object.entries(categoryPercentages.withoutKids).forEach(([category, percentage]) => {
            if (category !== 'counts' && category !== 'total') {
                const barContainer = withoutKidsPercentages.append("div")
                    .style("margin", "10px 0")
                    .style("text-align", "left");
                
                barContainer.append("div")
                    .style("font-size", "14px")
                    .style("margin-bottom", "5px")
                    .text(`${category}: ${percentage}%`);
                
                barContainer.append("div")
                    .style("width", "200px")
                    .style("height", "10px")
                    .style("background-color", "#e9ecef")
                    .style("border-radius", "5px")
                    .append("div")
                    .style("width", `${percentage}%`)
                    .style("height", "100%")
                    .style("background-color", getCategoryColor(category))
                    .style("border-radius", "5px")
                    .style("transition", "width 1s ease");
            }
        });
    }
}

// Navigation functions
function nextActivityGroup() {
    if (currentActivityGroupIndex < totalActivityGroups - 1) {
        animateToActivityGroup(currentActivityGroupIndex + 1);
    }
}

function previousActivityGroup() {
    if (currentActivityGroupIndex > 0) {
        animateToActivityGroup(currentActivityGroupIndex - 1);
    }
}

function jumpToActivityGroup(index) {
    animateToActivityGroup(index);
}

// Initialize with first activity group
animateToActivityGroup(0);

console.log(`Timeline initialized with ${totalActivityGroups} activity groups`);
