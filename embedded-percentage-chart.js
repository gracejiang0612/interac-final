// Embedded Working Mom Percentage Chart for Story Integration
async function drawEmbeddedWorkingMomChart() {
    // 1. Access data
    console.log('Loading working mom data for embedded chart...');
    
    let dataset;
    try {
        dataset = await d3.csv("./working-mom-percentage/Workingmom-final-data - Sheet1.csv");
    } catch (error) {
        console.error('Error loading data:', error);
        return;
    }
    
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
        width: Math.min(window.innerWidth * 0.8, 900),
        height: 450,
        margin: {
            top: 20,
            right: 120,
            bottom: 60,
            left: 80,
        },
    };
    
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
    
    // 3. Draw canvas - use the embedded container
    const wrapper = d3.select("#percentage-wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);
    
    const bounds = wrapper.append("g")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);
    
    // Add clip path
    bounds.append("defs").append("clipPath")
        .attr("id", "embedded-bounds-clip-path")
        .append("rect")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight);
    
    // 4. Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, xAccessor))
        .range([0, dimensions.boundedWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0.7, 0.85]) // Focused range for better visibility
        .range([dimensions.boundedHeight, 0]);
    
    // 5. Draw data
    const lineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(yAccessorUnder6(d)))
        .curve(d3.curveMonotoneX);
    
    const lineGenerator2 = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(yAccessorOver6(d)))
        .curve(d3.curveMonotoneX);
    
    // Draw lines
    const line1 = bounds.append("path")
        .attr("d", lineGenerator(dataset))
        .attr("fill", "none")
        .attr("stroke", "#e74c3c")
        .attr("stroke-width", 3)
        .attr("class", "line under6");
    
    const line2 = bounds.append("path")
        .attr("d", lineGenerator2(dataset))
        .attr("fill", "none")
        .attr("stroke", "#3498db")
        .attr("stroke-width", 3)
        .attr("class", "line over6");
    
    // Add dots
    const dots1 = bounds.selectAll(".dot-under6")
        .data(dataset)
        .enter().append("circle")
        .attr("class", "dot dot-under6")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessorUnder6(d)))
        .attr("r", 4)
        .attr("fill", "#e74c3c");
    
    const dots2 = bounds.selectAll(".dot-over6")
        .data(dataset)
        .enter().append("circle")
        .attr("class", "dot dot-over6")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessorOver6(d)))
        .attr("r", 4)
        .attr("fill", "#3498db");
    
    // 6. Draw peripherals
    // X-axis
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d3.format("d"));
    
    const xAxis = bounds.append("g")
        .call(xAxisGenerator)
        .attr("transform", `translate(0, ${dimensions.boundedHeight})`);
    
    // Y-axis
    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)
        .tickFormat(d3.format(".0%"));
    
    const yAxis = bounds.append("g")
        .call(yAxisGenerator);
    
    // Axis labels
    xAxis.append("text")
        .attr("x", dimensions.boundedWidth / 2)
        .attr("y", dimensions.margin.bottom - 10)
        .attr("fill", "black")
        .style("font-size", "1.2em")
        .style("text-anchor", "middle")
        .text("Year");
    
    yAxis.append("text")
        .attr("x", -dimensions.boundedHeight / 2)
        .attr("y", -dimensions.margin.left + 15)
        .attr("fill", "black")
        .style("font-size", "1.2em")
        .style("text-anchor", "middle")
        .style("transform", "rotate(-90deg)")
        .text("Employment Rate");
    
    // Legend
    const legend = bounds.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.boundedWidth + 20}, 50)`);
    
    // Legend items
    const legendData = [
        { label: "Mothers with children under 6", color: "#e74c3c" },
        { label: "Mothers with children 6-17", color: "#3498db" }
    ];
    
    const legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`);
    
    legendItems.append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", d => d.color)
        .attr("stroke-width", 3);
    
    legendItems.append("text")
        .attr("x", 25)
        .attr("y", 5)
        .text(d => d.label)
        .style("font-size", "0.9em")
        .attr("fill", "#333");
    
    // 7. Set up interactions - use embedded tooltip
    const tooltip = d3.select("#percentage-tooltip");
    
    // Hover interactions
    const allDots = bounds.selectAll(".dot");
    
    allDots.on("mouseenter", function(event, d) {
        const isUnder6 = d3.select(this).classed("dot-under6");
        
        tooltip.style("opacity", 1);
        
        d3.select("#percentage-year").text(d.year);
        d3.select("#under6-percentage").text(d3.format(".1%")(d.under6));
        d3.select("#over6-percentage").text(d3.format(".1%")(d.over6));
        
        // Position tooltip
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        tooltip
            .style("left", (mouseX + 15) + "px")
            .style("top", (mouseY - 28) + "px");
    })
    .on("mouseleave", function() {
        tooltip.style("opacity", 0);
    });
    
    console.log('Embedded working mom chart drawn successfully');
}

// Initialize the embedded chart when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawEmbeddedWorkingMomChart);
} else {
    drawEmbeddedWorkingMomChart();
}

