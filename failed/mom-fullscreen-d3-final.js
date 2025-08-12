// Final D3 Visualization with activity groups and hover enlargement

let currentActivityGroupIndex = 0;
let totalActivityGroups = (typeof activityGroups !== 'undefined') ? activityGroups.length : 0;
let timelineBlocks = [];
let gridCreated = false;

// Set up dimensions - reasonable size that fits in viewport
const timelineHeight = 800; // Fits in viewport
const timelineWidth = 160; // 2 times larger
const centerTimelineWidth = 600; // 2 times larger

// Create SVG for left timeline
const leftSvg = d3.select("#left-timeline")
    .append("svg")
    .attr("width", timelineWidth)
    .attr("height", timelineHeight)
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0");

// Create SVG for right timeline  
const rightSvg = d3.select("#right-timeline")
    .append("svg")
    .attr("width", timelineWidth)
    .attr("height", timelineHeight)
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0");

// Create SVG for center time axis
const centerSvg = d3.select("#time-axis")
    .append("svg")
    .attr("width", centerTimelineWidth)
    .attr("height", timelineHeight);

// Time scale (center ticks) - 20 hours mapped to timeline height (4AM to 12AM)
const timeScale = d3.scaleLinear()
    .domain([4 * 60, 24 * 60])
    .range([0, timelineHeight]);

// Draw center time axis
const timeAxis = d3.axisRight(timeScale)
    .tickFormat(d => {
        const hours = Math.floor(d / 60);
        const period = hours < 12 ? 'AM' : 'PM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours} ${period}`;
    })
    .tickValues(d3.range(4 * 60, 24 * 60 + 1, 60)) // Every hour from 4AM to 12AM
    .tickSize(15);

centerSvg.append("g")
    .attr("class", "time-axis")
    .attr("transform", `translate(${centerTimelineWidth/2}, 0)`)
    .call(timeAxis)
    .selectAll("text")
    .style("font-size", "14px")
    .style("fill", "#666");

// Add center timeline line
centerSvg.append("line")
    .attr("class", "center-timeline-line")
    .attr("x1", centerTimelineWidth/2)
    .attr("x2", centerTimelineWidth/2)
    .attr("y1", 0)
    .attr("y2", timelineHeight)
    .attr("stroke", "#869F77")
    .attr("stroke-width", 4)
    .attr("stroke-opacity", 0.6);

// ---------- Stacked column model ----------
const totalSlots = filteredRawData.length; // expected 80 from 4:00 to 0:00
const unitStackHeight = timelineHeight / totalSlots; // height for one 15-min block

// Build segment arrays per activity group (durations are multiples of 15 minutes)
let leftSegments = (typeof activityGroups !== 'undefined' ? activityGroups : []).map(g => ({
    category: g.withKidCategory,
    activity: g.withKidActivity,
    blocks: g.duration,
    color: getCategoryColor(g.withKidCategory)
}));
let rightSegments = (typeof activityGroups !== 'undefined' ? activityGroups : []).map(g => ({
    category: g.withoutKidCategory,
    activity: g.withoutKidActivity,
    blocks: g.duration,
    color: getCategoryColor(g.withoutKidCategory)
}));

// Pre-create all segment rects with zero height (they will grow as you scroll)
const leftStack = d3.select("#left-timeline svg");
const rightStack = d3.select("#right-timeline svg");

const leftRects = leftStack.selectAll(".stack-segment")
    .data(leftSegments)
    .enter()
    .append("rect")
    .attr("class", d => `stack-segment ${d.category.toLowerCase()}`)
    .attr("x", 0)
    .attr("y", timelineHeight)
    .attr("width", timelineWidth)
    .attr("height", 0)
    .attr("fill", d => d.color)
    .style("opacity", 0.9)
    .style("stroke", "#fff")
    .style("stroke-width", 2);

const rightRects = rightStack.selectAll(".stack-segment")
    .data(rightSegments)
    .enter()
    .append("rect")
    .attr("class", d => `stack-segment ${d.category.toLowerCase()}`)
    .attr("x", 0)
    .attr("y", timelineHeight)
    .attr("width", timelineWidth)
    .attr("height", 0)
    .attr("fill", d => d.color)
    .style("opacity", 0.9)
    .style("stroke", "#fff")
    .style("stroke-width", 2);

function layoutStacks(currentIndex) {
    // Left
    let cumLeft = 0;
    leftRects.each(function(d, i) {
        const targetBlocks = i <= currentIndex ? d.blocks : 0;
        const h = targetBlocks * unitStackHeight;
        const y = timelineHeight - (cumLeft + h);
        d3.select(this)
            .transition().duration(450).ease(d3.easeCubicInOut)
            .attr("y", y)
            .attr("height", h);
        cumLeft += h;
    });
    // Right
    let cumRight = 0;
    rightRects.each(function(d, i) {
        const targetBlocks = i <= currentIndex ? d.blocks : 0;
        const h = targetBlocks * unitStackHeight;
        const y = timelineHeight - (cumRight + h);
        d3.select(this)
            .transition().duration(450).ease(d3.easeCubicInOut)
            .attr("y", y)
            .attr("height", h);
        cumRight += h;
    });
}

// Function to update the current time display
function updateTimeDisplay(index) {
    const group = activityGroups[index];
    const timeRange = group.duration === 1 ? 
        formatTime(group.startTime) : 
        `${formatTime(group.startTime)} - ${formatTime(group.endTime)}`;
    d3.select("#current-time").text(timeRange);
}

// Function to update activity descriptions
function updateActivityDescriptions(index) {
    const group = activityGroups[index];
    
    d3.select("#left-activity")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this)
                .html(group.withKidActivity)
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
                .html(group.withoutKidActivity)
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
    
    // Lay out the stacked columns to the current group index
    layoutStacks(targetIndex);
    
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
    const cellHeight = gridHeight / 8; // 8 hours (4AM to 12PM)
    
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
    
    // Animate each 15-min block (more granular) from stacked columns to grid
    const leftColRect = document.querySelector('#left-timeline').getBoundingClientRect();
    const rightColRect = document.querySelector('#right-timeline').getBoundingClientRect();

    filteredRawData.forEach((slot, idx) => {
        const hour = Math.floor((idx * 15 + 240) / 60) - 4; // 0..19
        const quarter = Math.floor(((idx * 15) % 60) / 15);
        
        const leftGridX = leftGridRect.left + gridMargin.left + quarter * cellWidth;
        const leftGridY = leftGridRect.top + gridMargin.top + hour * cellHeight;
        const rightGridX = rightGridRect.left + gridMargin.left + quarter * cellWidth;
        const rightGridY = rightGridRect.top + gridMargin.top + hour * cellHeight;

        const startYStack = leftColRect.top + (timelineHeight - (idx + 1) * unitStackHeight);
        const startYStackRight = rightColRect.top + (timelineHeight - (idx + 1) * unitStackHeight);

        // Left flyer
        const leftFlyer = flyingContainer.append('div')
            .style('position', 'absolute')
            .style('width', `${timelineWidth}px`)
            .style('height', `${unitStackHeight}px`)
            .style('left', `${leftColRect.left}px`)
            .style('top', `${startYStack}px`)
            .style('background-color', getCategoryColor(slot.withKidCategory))
            .style('opacity', '0.9');

        // Right flyer
        const rightFlyer = flyingContainer.append('div')
            .style('position', 'absolute')
            .style('width', `${timelineWidth}px`)
            .style('height', `${unitStackHeight}px`)
            .style('left', `${rightColRect.left}px`)
            .style('top', `${startYStackRight}px`)
            .style('background-color', getCategoryColor(slot.withoutKidCategory))
            .style('opacity', '0.9');

        const delay = idx * 8; // small stagger
        leftFlyer.transition().delay(delay).duration(1200).ease(d3.easeCubicInOut)
            .style('left', `${leftGridX}px`)
            .style('top', `${leftGridY}px`)
            .style('width', `${cellWidth}px`)
            .style('height', `${cellHeight}px`);
        rightFlyer.transition().delay(delay).duration(1200).ease(d3.easeCubicInOut)
            .style('left', `${rightGridX}px`)
            .style('top', `${rightGridY}px`)
            .style('width', `${cellWidth}px`)
            .style('height', `${cellHeight}px`)
            .on('end', function() {
                if (idx === filteredRawData.length - 1) {
                    setTimeout(() => {
                        createGridVisualization();
                        flyingContainer.remove();
                    }, 300);
                }
            });
    });
}

// Grid visualization with percentage summary
function createGridVisualization() {
    if (gridCreated) return; // Already created
    gridCreated = true;
    
    console.log("Creating final grid visualization...");
    
    // Grid dimensions
    const gridMargin = {top: 60, right: 30, bottom: 80, left: 80};
    const gridWidth = 520 - gridMargin.left - gridMargin.right;
    const gridHeight = 520 - gridMargin.top - gridMargin.bottom;
    const cellWidth = gridWidth / 4;
    const cellHeight = gridHeight / 20; // 20 hours (4AM to 12AM)
    
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
        const gridData = activityGroups.map((group, i) => {
            const startHour = Math.floor(group.timeBlocks[0].totalMinutes / 60) - 4; // Adjust for 4AM start
            const startQuarter = Math.floor((group.timeBlocks[0].totalMinutes % 60) / 15);
            const category = dataKey === "withKid" ? group.withKidCategory : group.withoutKidCategory;
            const activity = dataKey === "withKid" ? group.withKidActivity : group.withoutKidActivity;
            
            return {
                hour: startHour,
                quarter: startQuarter,
                x: startQuarter * cellWidth,
                y: startHour * cellHeight,
                width: group.duration * cellWidth,
                height: cellHeight,
                category: category,
                activity: activity,
                time: `${formatTime(group.startTime)} - ${formatTime(group.endTime)}`,
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
            .attr("width", d => d.width)
            .attr("height", d => d.height)
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
        
        // Add time labels (4AM to 12AM)
        const hourLabels = g.selectAll(".hour-label")
            .data(d3.range(20)) // 20 hours
            .enter()
            .append("text")
            .attr("class", "grid-axis")
            .attr("x", -15)
            .attr("y", d => d * cellHeight + cellHeight/2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => {
                const hour = d + 4; // Start from 4AM
                const period = hour < 12 ? 'AM' : 'PM';
                const displayHours = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                return `${displayHours} ${period}`;
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
            .style("color", "#869F77")
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
            .style("color", "#869F77")
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
console.log("Starting timeline initialization...");
console.log(`Total activity groups: ${totalActivityGroups}`);
console.log("Activity groups:", activityGroups);

function hydrateFromData() {
    if (typeof activityGroups === 'undefined' || !activityGroups.length) return;
    totalActivityGroups = activityGroups.length;
    leftSegments = activityGroups.map(g => ({ category: g.withKidCategory, activity: g.withKidActivity, blocks: g.duration, color: getCategoryColor(g.withKidCategory) }));
    rightSegments = activityGroups.map(g => ({ category: g.withoutKidCategory, activity: g.withoutKidActivity, blocks: g.duration, color: getCategoryColor(g.withoutKidCategory) }));
    // Rebind data
    leftStack.selectAll('*').remove();
    rightStack.selectAll('*').remove();
    leftStack.selectAll('.stack-segment').data(leftSegments).enter().append('rect').attr('class', d => `stack-segment ${d.category.toLowerCase()}`).attr('x',0).attr('y',timelineHeight).attr('width',timelineWidth).attr('height',0).attr('fill', d=>d.color).style('opacity',0.9).style('stroke','#fff').style('stroke-width',2);
    rightStack.selectAll('.stack-segment').data(rightSegments).enter().append('rect').attr('class', d => `stack-segment ${d.category.toLowerCase()}`).attr('x',0).attr('y',timelineHeight).attr('width',timelineWidth).attr('height',0).attr('fill', d=>d.color).style('opacity',0.9).style('stroke','#fff').style('stroke-width',2);
    layoutStacks(0);
}

window.addEventListener('data-ready', hydrateFromData);

animateToActivityGroup(0);

console.log(`Timeline initialized with ${totalActivityGroups} activity groups`);
