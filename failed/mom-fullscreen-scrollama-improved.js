// Improved Scrollama integration for grouped activity timeline

// Create scroll sections for each activity group (not individual time blocks)
function createScrollSections() {
    const container = d3.select("#timeline-container");
    
    // Create a section for each activity group
    activityGroups.forEach((group, index) => {
        const section = container.append("div")
            .attr("class", "scroll-section")
            .attr("data-group-index", index)
            .style("height", "100vh")
            .style("position", "relative");
    });
    
    console.log(`Created ${activityGroups.length} scroll sections for activity groups`);
}

// Enhanced scroll experience with activity groups
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
        const timelineEnd = introHeight + (activityGroups.length * windowHeight); // Use activity groups, not individual blocks
        const gridSectionStart = timelineEnd;
        const gridSectionEnd = gridSectionStart + windowHeight;
        
        if (scrollTop >= timelineStart && scrollTop < timelineEnd) {
            // We're in the timeline section
            const timelineScrollTop = scrollTop - timelineStart;
            const sectionIndex = Math.floor(timelineScrollTop / windowHeight);
            const clampedIndex = Math.max(0, Math.min(sectionIndex, activityGroups.length - 1));
            
            if (clampedIndex !== currentActivityGroupIndex) {
                jumpToActivityGroup(clampedIndex);
            }
        } else if (scrollTop >= gridSectionStart && scrollTop < gridSectionEnd) {
            // We're in the grid transition section
            if (!gridTransformTriggered) {
                gridTransformTriggered = true;
                console.log("Triggering flying animation to grid...");
                setTimeout(() => {
                    createFlyingAnimation();
                }, 300);
            }
        }
    });
}

// Smooth navigation with activity groups
function setupSmoothNavigation() {
    // Add keyboard navigation
    document.addEventListener('keydown', (event) => {
        switch(event.key) {
            case 'ArrowDown':
            case ' ':
                event.preventDefault();
                nextActivityGroup();
                // Scroll to next section
                const nextSection = document.querySelector(`[data-group-index="${currentActivityGroupIndex}"]`);
                if (nextSection) {
                    nextSection.scrollIntoView({ behavior: 'smooth' });
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                previousActivityGroup();
                // Scroll to previous section
                const prevSection = document.querySelector(`[data-group-index="${currentActivityGroupIndex}"]`);
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
                // Swipe up - next group
                nextActivityGroup();
            } else {
                // Swipe down - previous group
                previousActivityGroup();
            }
        }
    });
}

// Add visual indicators for activity group progress
function addProgressIndicator() {
    const progressContainer = d3.select("body")
        .append("div")
        .attr("class", "progress-indicator")
        .style("position", "fixed")
        .style("right", "30px")
        .style("top", "50%")
        .style("transform", "translateY(-50%)")
        .style("z-index", "1000")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("gap", "8px");
    
    // Create progress dots
    const dots = progressContainer.selectAll(".progress-dot")
        .data(activityGroups)
        .enter()
        .append("div")
        .attr("class", "progress-dot")
        .style("width", "12px")
        .style("height", "12px")
        .style("border-radius", "50%")
        .style("background-color", "#e9ecef")
        .style("border", "2px solid #5126AE")
        .style("cursor", "pointer")
        .style("transition", "all 0.3s ease")
        .on("click", function(event, d, i) {
            jumpToActivityGroup(i);
            const section = document.querySelector(`[data-group-index="${i}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    
    // Update progress indicator
    window.updateProgressIndicator = function(currentIndex) {
        dots.style("background-color", (d, i) => i === currentIndex ? "#5126AE" : "#e9ecef");
    };
}

// Modify the jumpToActivityGroup function to update progress
const originalJumpToActivityGroup = jumpToActivityGroup;
jumpToActivityGroup = function(index) {
    originalJumpToActivityGroup(index);
    if (window.updateProgressIndicator) {
        window.updateProgressIndicator(index);
    }
};

// Initialize everything
function init() {
    // Create scroll sections for activity groups
    createScrollSections();
    
    // Add progress indicator
    addProgressIndicator();
    
    // Setup enhanced scrolling
    setupEnhancedScrolling();
    
    // Setup navigation
    setupSmoothNavigation();
    
    console.log("Improved scrollama initialized with activity groups");
}

// Initialize
init();
