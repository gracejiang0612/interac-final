async function drawWorkingMomChart() {
    // 1. Access data
    console.log('Loading working mom data...');
    
    let dataset = await d3.csv("./Workingmom-final-data - Sheet1.csv");
    console.log('Raw data:', dataset);
    
    // Parse and clean the data
    dataset = dataset.map(d => ({
        year: +d.Year,
        under6: +d["Working-mom-percentage-under6yos"],
        over6: +d["working_mom_6yosto17yos_percentage"]
    })).filter(d => !isNaN(d.year) && !isNaN(d.under6) && !isNaN(d.over6));
    
    console.log('Processed data:', dataset);
    
    // Data accessors
    const xAccessor = d => d.year;
    const yAccessorUnder6 = d => d.under6;
    const yAccessorOver6 = d => d.over6;
    
    // 2. Create chart dimensions
    let dimensions = {
        width: Math.min(window.innerWidth * 0.9, 1000),
        height: 500,
        margin: {
            top: 20,
            right: 120,
            bottom: 60,
            left: 80,
        },
    };
    
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
    
    // 3. Draw canvas
    const wrapper = d3.select("#wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);
    
    const bounds = wrapper.append("g")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);
    
    // Add clip path
    bounds.append("defs").append("clipPath")
        .attr("id", "bounds-clip-path")
        .append("rect")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight);
    
    const clip = bounds.append("g")
        .attr("clip-path", "url(#bounds-clip-path)");
    
    // 4. Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, xAccessor))
        .range([0, dimensions.boundedWidth]);
    
    // Get the combined extent for both y values
    const allYValues = [
        ...dataset.map(yAccessorUnder6),
        ...dataset.map(yAccessorOver6)
    ];
    
    const yScale = d3.scaleLinear()
        .domain([
            Math.min(0.75, d3.min(allYValues) - 0.01), // Start slightly below minimum
            Math.max(0.85, d3.max(allYValues) + 0.01)  // End slightly above maximum
        ])
        .range([dimensions.boundedHeight, 0]);
    
    // 5. Add grid lines
    const yAxisGrid = d3.axisLeft(yScale)
        .tickSize(-dimensions.boundedWidth)
        .tickFormat("")
        .ticks(6);
    
    bounds.append("g")
        .attr("class", "grid")
        .call(yAxisGrid);
    
    const xAxisGrid = d3.axisBottom(xScale)
        .tickSize(-dimensions.boundedHeight)
        .tickFormat("")
        .ticks(dataset.length);
    
    bounds.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${dimensions.boundedHeight})`)
        .call(xAxisGrid);
    
    // 6. Draw data lines
    const lineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .curve(d3.curveCardinal);
    
    // Line for mothers with children under 6
    const lineUnder6 = lineGenerator.y(d => yScale(yAccessorUnder6(d)));
    const pathUnder6 = clip.append("path")
        .attr("class", "line under6")
        .attr("d", lineUnder6(dataset));
    
    // Line for mothers with children 6-17
    const lineOver6 = lineGenerator.y(d => yScale(yAccessorOver6(d)));
    const pathOver6 = clip.append("path")
        .attr("class", "line over6")
        .attr("d", lineOver6(dataset));
    
    // 7. Draw axes
    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)
        .tickFormat(d => `${(d * 100).toFixed(1)}%`);
    
    const yAxis = bounds.append("g")
        .attr("class", "y-axis axis")
        .call(yAxisGenerator);
    
    const yAxisLabel = bounds.append("text")
        .attr("class", "y-axis-label")
        .attr("x", dimensions.boundedWidth + 8)
        .attr("y", dimensions.boundedHeight / 2)
        .attr("transform", `rotate(-90, ${dimensions.boundedWidth + 8}, ${dimensions.boundedHeight / 2})`)
        .style("text-anchor", "middle")
        .text("Employment Rate (%)");
    
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d3.format("d"))
        .ticks(dataset.length);
    
    const xAxis = bounds.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0, ${dimensions.boundedHeight})`)
        .call(xAxisGenerator);
    
    const xAxisLabel = xAxis.append("text")
        .attr("class", "x-axis-label")
        .attr("x", dimensions.boundedWidth / 2)
        .attr("y", 45)
        .style("text-anchor", "middle")
        .text("Year");
    
    // 8. Set up interactions
    const listeningRect = bounds.append("rect")
        .attr("class", "listening-rect")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)
        .on("mousemove", onMouseMove)
        .on("mouseleave", onMouseLeave);
    
    const tooltip = d3.select("#tooltip");
    
    // Create tooltip circles for both lines
    const tooltipCircleUnder6 = bounds.append("circle")
        .attr("class", "tooltip-circle under6")
        .attr("r", 6)
        .attr("stroke-width", 3)
        .style("opacity", 0);
    
    const tooltipCircleOver6 = bounds.append("circle")
        .attr("class", "tooltip-circle over6")
        .attr("r", 6)
        .attr("stroke-width", 3)
        .style("opacity", 0);
    
    function onMouseMove(event) {
        const mousePosition = d3.pointer(event);
        const hoveredYear = xScale.invert(mousePosition[0]);
        
        // Find the closest data point
        const getDistanceFromHoveredYear = d => Math.abs(xAccessor(d) - hoveredYear);
        const closestIndex = d3.leastIndex(dataset, (a, b) => (
            getDistanceFromHoveredYear(a) - getDistanceFromHoveredYear(b)
        ));
        const closestDataPoint = dataset[closestIndex];
        
        const closestXValue = xAccessor(closestDataPoint);
        const closestYValueUnder6 = yAccessorUnder6(closestDataPoint);
        const closestYValueOver6 = yAccessorOver6(closestDataPoint);
        
        // Update tooltip content
        tooltip.select("#year").text(closestXValue);
        tooltip.select("#under6-percentage").html(`<span class="percentage">${(closestYValueUnder6 * 100).toFixed(1)}%</span>`);
        tooltip.select("#over6-percentage").html(`<span class="percentage">${(closestYValueOver6 * 100).toFixed(1)}%</span>`);
        
        // Position tooltip
        const x = xScale(closestXValue) + dimensions.margin.left;
        const y = yScale(Math.max(closestYValueUnder6, closestYValueOver6)) + dimensions.margin.top;
        
        tooltip.style("transform", `translate(calc(-50% + ${x}px), calc(-100% + ${y - 20}px))`);
        tooltip.style("opacity", 1);
        
        // Position and show circles
        tooltipCircleUnder6
            .attr("cx", xScale(closestXValue))
            .attr("cy", yScale(closestYValueUnder6))
            .style("opacity", 1);
        
        tooltipCircleOver6
            .attr("cx", xScale(closestXValue))
            .attr("cy", yScale(closestYValueOver6))
            .style("opacity", 1);
    }
    
    function onMouseLeave() {
        tooltip.style("opacity", 0);
        tooltipCircleUnder6.style("opacity", 0);
        tooltipCircleOver6.style("opacity", 0);
    }
    
    // 9. Add data points
    const pointsUnder6 = clip.selectAll(".point-under6")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("class", "point-under6")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessorUnder6(d)))
        .attr("r", 4)
        .attr("fill", "#e74c3c")
        .attr("stroke", "white")
        .attr("stroke-width", 2);
    
    const pointsOver6 = clip.selectAll(".point-over6")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("class", "point-over6")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessorOver6(d)))
        .attr("r", 4)
        .attr("fill", "#3498db")
        .attr("stroke", "white")
        .attr("stroke-width", 2);
    
    console.log('Chart rendered successfully!');
}

// Initialize the chart when the page loads
drawWorkingMomChart();
