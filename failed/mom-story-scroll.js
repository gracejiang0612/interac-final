// Working Mom Story Scroll Controller
// Handles scroll-driven navigation through the story

let scrollController = null;
let isScrolling = false;
let scrollTimeout = null;

// Initialize scroll controller when data is ready
window.addEventListener('storyDataReady', function(event) {
    const { activityBlocks } = event.detail;
    
    console.log('Initializing scroll controller for', activityBlocks.length, 'steps');
    
    setupScrollController(activityBlocks);
});

// Setup scroll-based navigation
function setupScrollController(blocks) {
    let lastScrollTime = 0;
    let currentSection = 0;
    
    // Calculate scroll boundaries
    function getScrollBoundaries() {
        const windowHeight = window.innerHeight;
        const introHeight = windowHeight;
        const storyHeight = blocks.length * windowHeight;
        const gridHeight = windowHeight;
        
        return {
            intro: { start: 0, end: introHeight },
            story: { start: introHeight, end: introHeight + storyHeight },
            grid: { start: introHeight + storyHeight, end: introHeight + storyHeight + gridHeight }
        };
    }
    
    // Handle scroll events
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const boundaries = getScrollBoundaries();
        
        // Throttle scroll events
        const now = Date.now();
        if (now - lastScrollTime < 16) return; // ~60fps
        lastScrollTime = now;
        
        // Determine current section
        if (scrollTop >= boundaries.intro.start && scrollTop < boundaries.intro.end) {
            // In intro section
            currentSection = -1;
        } else if (scrollTop >= boundaries.story.start && scrollTop < boundaries.story.end) {
            // In story section
            const storyProgress = scrollTop - boundaries.story.start;
            const stepIndex = Math.floor(storyProgress / window.innerHeight);
            const clampedIndex = Math.max(0, Math.min(stepIndex, blocks.length - 1));
            
            if (clampedIndex !== currentStepIndex) {
                showStep(clampedIndex);
                currentSection = clampedIndex;
            }
        } else if (scrollTop >= boundaries.grid.start) {
            // In grid section
            currentSection = blocks.length;
            
            // Trigger grid transformation if not already done
            if (currentStepIndex < blocks.length - 1) {
                showStep(blocks.length - 1);
                setTimeout(() => {
                    triggerFinalTransformation();
                }, 500);
            }
        }
    }
    
    // Smooth scroll to section
    function scrollToSection(sectionIndex) {
        const boundaries = getScrollBoundaries();
        let targetScroll;
        
        if (sectionIndex < 0) {
            targetScroll = 0;
        } else if (sectionIndex >= blocks.length) {
            targetScroll = boundaries.grid.start;
        } else {
            targetScroll = boundaries.story.start + (sectionIndex * window.innerHeight);
        }
        
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add wheel event for more responsive scrolling
    let wheelTimeout = null;
    window.addEventListener('wheel', function(event) {
        event.preventDefault();
        
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            const delta = event.deltaY;
            
            if (delta > 0) {
                // Scroll down
                nextStep();
            } else {
                // Scroll up
                previousStep();
            }
        }, 50);
    }, { passive: false });
    
    // Add touch support for mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    window.addEventListener('touchstart', function(event) {
        touchStartY = event.touches[0].clientY;
    }, { passive: true });
    
    window.addEventListener('touchend', function(event) {
        touchEndY = event.changedTouches[0].clientY;
        const touchDiff = touchStartY - touchEndY;
        
        // Minimum swipe distance
        if (Math.abs(touchDiff) > 50) {
            if (touchDiff > 0) {
                // Swipe up - next step
                nextStep();
            } else {
                // Swipe down - previous step
                previousStep();
            }
        }
    }, { passive: true });
    
    // Expose scroll functions globally
    window.scrollToSection = scrollToSection;
    window.getCurrentSection = () => currentSection;
    
    console.log('Scroll controller initialized');
}

// Enhanced navigation with scroll synchronization
function enhancedNextStep() {
    if (currentStepIndex < totalSteps - 1) {
        const nextIndex = currentStepIndex + 1;
        showStep(nextIndex);
        
        // Scroll to the step
        setTimeout(() => {
            scrollToSection(nextIndex);
        }, 100);
    } else {
        // At the end, scroll to grid
        scrollToSection(totalSteps);
    }
}

function enhancedPreviousStep() {
    if (currentStepIndex > 0) {
        const prevIndex = currentStepIndex - 1;
        showStep(prevIndex);
        
        // Scroll to the step
        setTimeout(() => {
            scrollToSection(prevIndex);
        }, 100);
    } else {
        // At the beginning, scroll to intro
        scrollToSection(-1);
    }
}

// Replace global navigation functions
window.nextStep = enhancedNextStep;
window.previousStep = enhancedPreviousStep;

// Add intersection observer for more precise control
function setupIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stepIndex = parseInt(entry.target.getAttribute('data-step'));
                if (!isNaN(stepIndex) && stepIndex !== currentStepIndex) {
                    showStep(stepIndex);
                }
            }
        });
    }, observerOptions);
    
    // Observe all story steps when they're created
    window.addEventListener('storyDataReady', function() {
        setTimeout(() => {
            document.querySelectorAll('.story-step').forEach(step => {
                observer.observe(step);
            });
        }, 100);
    });
}

// Add resize handler to recalculate boundaries
window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        console.log('Recalculating scroll boundaries after resize');
        // Trigger scroll handler to update current position
        window.dispatchEvent(new Event('scroll'));
    }, 250);
});

// Initialize intersection observer
setupIntersectionObserver();

// Add scroll progress indicator
function addScrollProgress() {
    const progressBar = d3.select('body')
        .append('div')
        .style('position', 'fixed')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '4px')
        .style('background', 'rgba(255,255,255,0.3)')
        .style('z-index', '10000');
    
    const progressFill = progressBar.append('div')
        .style('height', '100%')
        .style('width', '0%')
        .style('background', 'linear-gradient(90deg, #E7B5AC, #869F77)')
        .style('transition', 'width 0.3s ease');
    
    function updateProgress() {
        if (totalSteps > 0) {
            const progress = (currentStepIndex + 1) / totalSteps * 100;
            progressFill.style('width', Math.min(progress, 100) + '%');
        }
    }
    
    // Update progress when step changes
    window.addEventListener('storyDataReady', function() {
        setInterval(updateProgress, 100);
    });
}

// Initialize scroll progress
addScrollProgress();

console.log('Scroll controller loaded');
