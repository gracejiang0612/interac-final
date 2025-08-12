// Scrollama integration for fullscreen timeline

// Create scroll sections for each time block
function createScrollSections() {
    const container = d3.select("#timeline-container");
    
    // Create a section for each time block
    timelineData.forEach((timeData, index) => {
        const section = container.append("div")
            .attr("class", "scroll-section")
            .attr("data-index", index)
            .style("height", "100vh")
            .style("position", "relative");
    });
}

// Initialize scrollama
const scroller = scrollama();

// Handle scroll events
function handleStepEnter(response) {
    const index = +response.element.getAttribute('data-index');
    console.log(`Entering time block ${index}: ${timelineData[index].formattedTime}`);
    
    // Animate to the corresponding time block
    jumpToTimeBlock(index);
}

function handleStepExit(response) {
    // Optional: handle exit events
}

// Resize handler
function handleResize() {
    scroller.resize();
}

// Initialize everything
function init() {
    // Create scroll sections
    createScrollSections();
    
    // Setup scrollama
    scroller
        .setup({
            step: '.scroll-section',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(handleStepEnter)
        .onStepExit(handleStepExit);
    
    // Setup resize listener
    window.addEventListener('resize', handleResize);
}

// Alternative: Use scroll position to determine time block
function setupAlternativeScrolling() {
    let ticking = false;
    
    function updateOnScroll() {
        const scrollTop = window.pageY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        
        // Skip intro section
        const timelineStart = windowHeight;
        const timelineScrollTop = scrollTop - timelineStart;
        
        if (timelineScrollTop >= 0) {
            // Calculate which time block we should be showing
            const blockIndex = Math.floor(timelineScrollTop / windowHeight);
            const clampedIndex = Math.max(0, Math.min(blockIndex, totalTimeBlocks - 1));
            
            if (clampedIndex !== currentTimeBlockIndex) {
                jumpToTimeBlock(clampedIndex);
            }
        }
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Smooth scrolling navigation
function setupSmoothNavigation() {
    // Add keyboard navigation
    document.addEventListener('keydown', (event) => {
        switch(event.key) {
            case 'ArrowDown':
            case ' ':
                event.preventDefault();
                nextTimeBlock();
                // Scroll to next section
                const nextSection = document.querySelector(`[data-index="${currentTimeBlockIndex}"]`);
                if (nextSection) {
                    nextSection.scrollIntoView({ behavior: 'smooth' });
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                previousTimeBlock();
                // Scroll to previous section
                const prevSection = document.querySelector(`[data-index="${currentTimeBlockIndex}"]`);
                if (prevSection) {
                    prevSection.scrollIntoView({ behavior: 'smooth' });
                }
                break;
        }
    });
    
    // Add touch/swipe support for mobile
    let startY = 0;
    let startX = 0;
    
    document.addEventListener('touchstart', (event) => {
        startY = event.touches[0].clientY;
        startX = event.touches[0].clientX;
    });
    
    document.addEventListener('touchend', (event) => {
        const endY = event.changedTouches[0].clientY;
        const endX = event.changedTouches[0].clientX;
        const diffY = startY - endY;
        const diffX = Math.abs(startX - endX);
        
        // Only respond to vertical swipes
        if (Math.abs(diffY) > 50 && diffX < 100) {
            if (diffY > 0) {
                // Swipe up - next block
                nextTimeBlock();
            } else {
                // Swipe down - previous block
                previousTimeBlock();
            }
        }
    });
}

// Enhanced scroll experience with smooth transitions
function setupEnhancedScrolling() {
    let lastScrollTop = 0;
    let scrollDirection = 'down';
    let gridTransformTriggered = false;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageY || document.documentElement.scrollTop;
        scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        lastScrollTop = scrollTop;
        
        // Calculate current section based on scroll position
        const windowHeight = window.innerHeight;
        const introHeight = windowHeight; // Intro section height
        const timelineStart = introHeight;
        const timelineEnd = introHeight + (totalTimeBlocks * windowHeight);
        const gridSectionStart = timelineEnd;
        const gridSectionEnd = gridSectionStart + windowHeight;
        
        if (scrollTop >= timelineStart && scrollTop < timelineEnd) {
            // We're in the timeline section
            const timelineScrollTop = scrollTop - timelineStart;
            const sectionIndex = Math.floor(timelineScrollTop / windowHeight);
            const clampedIndex = Math.max(0, Math.min(sectionIndex, totalTimeBlocks - 1));
            
            if (clampedIndex !== currentTimeBlockIndex) {
                jumpToTimeBlock(clampedIndex);
            }
        } else if (scrollTop >= gridSectionStart && scrollTop < gridSectionEnd) {
            // We're in the grid transition section
            if (!gridTransformTriggered) {
                gridTransformTriggered = true;
                console.log("Triggering grid transformation...");
                setTimeout(() => {
                    transformToGrid();
                }, 200);
            }
        }
    });
}

// Initialize based on preferred method
// Using the enhanced scrolling for better UX
setupEnhancedScrolling();
setupSmoothNavigation();

// Also create the scroll sections for proper spacing
createScrollSections();

console.log(`Timeline initialized with ${totalTimeBlocks} time blocks`);
