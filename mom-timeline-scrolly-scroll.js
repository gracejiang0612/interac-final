// Scrollama controller for working mother timeline
class ScrollController {
    constructor() {
        this.scroller = null;
        this.scrollBlocks = null;
        this.currentStepIndex = -1;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Load data through visualization (which loads from timelineData)
            console.log('Loading timeline data...');
            await timelineViz.loadData();
            
            // Get scroll blocks
            console.log('Getting scroll blocks...');
            this.scrollBlocks = timelineData.getScrollBlocks();
            console.log('Scroll blocks retrieved:', this.scrollBlocks ? this.scrollBlocks.length : 0);
            
            if (!this.scrollBlocks || this.scrollBlocks.length === 0) {
                console.error('No scroll blocks available!');
                console.log('TimelineData rawData:', timelineData.rawData ? timelineData.rawData.length : 0);
                console.log('TimelineData timeBlocks:', timelineData.timeBlocks ? timelineData.timeBlocks.length : 0);
                
                // Create minimal scroll blocks for basic functionality
                console.log('Creating minimal scroll blocks...');
                this.scrollBlocks = this.createMinimalScrollBlocks();
            }
            
            // Generate dynamic scroll steps
            console.log('Generating scroll steps...');
            this.generateScrollSteps();
            
            // Initialize Scrollama
            console.log('Setting up Scrollama...');
            
            // Count actual DOM steps before setting up scrollama
            const domSteps = document.querySelectorAll('.step');
            console.log('DOM steps found:', domSteps.length);
            domSteps.forEach((step, i) => {
                console.log(`  Step ${i}: ${step.getAttribute('data-step')}`);
            });
            
            this.setupScrollama();
            
            this.isInitialized = true;
            console.log('Scroll controller initialized with', this.scrollBlocks.length, 'steps');
            
        } catch (error) {
            console.error('Error initializing scroll controller:', error);
        }
    }

    createMinimalScrollBlocks() {
        // Create basic scroll blocks for demonstration if data loading fails
        const blocks = [];
        const times = [240, 300, 360, 480, 540, 720, 960, 1200, 1440]; // 4am, 5am, 6am, 8am, 9am, 12pm, 4pm, 8pm, 12am
        const activities = [
            'Wake up', 'Exercise', 'Breakfast', 'Work', 'Lunch', 
            'Work continues', 'Pick up child', 'Dinner', 'Sleep'
        ];
        
        times.forEach((time, index) => {
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
            
            blocks.push({
                time: time,
                timeString: timeString,
                withKid: {
                    activity: activities[index],
                    category: index < 3 ? 'Self' : (index < 6 ? 'Work' : 'Kid'),
                    startTime: time,
                    endTime: times[index + 1] || 1440,
                    duration: (times[index + 1] || 1440) - time
                },
                withoutKid: {
                    activity: activities[index] + ' (alone)',
                    category: index < 3 ? 'Self' : 'Work',
                    startTime: time,
                    endTime: times[index + 1] || 1440,
                    duration: (times[index + 1] || 1440) - time
                }
            });
        });
        
        console.log('Created', blocks.length, 'minimal scroll blocks');
        return blocks;
    }

    generateScrollSteps() {
        const dynamicStepsContainer = d3.select('#dynamic-steps');
        
        // Clear existing steps
        dynamicStepsContainer.selectAll('*').remove();
        
        console.log('Generating steps for', this.scrollBlocks.length, 'scroll blocks');
        console.log('First few scroll blocks:');
        this.scrollBlocks.slice(0, 10).forEach((block, i) => {
            console.log(`  ${i}: ${block.timeString} (${block.time} min)`);
        });
        
        // Create a step for each time block
        this.scrollBlocks.forEach((block, index) => {
            const stepDiv = dynamicStepsContainer
                .append('div')
                .attr('class', 'step')
                .attr('data-step', `time-${index}`)
                .style('height', '100vh')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'center');

            const contentDiv = stepDiv
                .append('div')
                .attr('class', 'step-content')
                .style('background', 'rgba(255, 255, 255, 0.9)')
                .style('padding', '30px 40px')
                .style('border-radius', '15px')
                .style('box-shadow', '0 5px 20px rgba(0, 0, 0, 0.1)')
                .style('max-width', '500px')
                .style('text-align', 'center')
                .style('margin', '0 20px');

            // Add time header
            contentDiv.append('h3')
                .style('font-size', '1.8rem')
                .style('margin-bottom', '20px')
                .style('color', '#333')
                .text(this.formatTime(block.timeString));

            // Add activity comparison
            const comparisonDiv = contentDiv.append('div')
                .style('display', 'grid')
                .style('grid-template-columns', '1fr 1fr')
                .style('gap', '20px')
                .style('margin-top', '20px');

            // With kid column
            const withKidDiv = comparisonDiv.append('div')
                .style('padding', '15px')
                .style('background', 'rgba(222, 71, 100, 0.1)')
                .style('border-radius', '10px')
                .style('border-left', '4px solid #DE4764');

            withKidDiv.append('h4')
                .style('margin-bottom', '10px')
                .style('color', '#DE4764')
                .text('With Kid');

            if (block.withKid) {
                withKidDiv.append('p')
                    .style('font-size', '0.9rem')
                    .style('line-height', '1.4')
                    .style('color', '#555')
                    .text(block.withKid.activity);
                
                withKidDiv.append('small')
                    .style('color', '#777')
                    .style('font-size', '0.8rem')
                    .text(`${block.withKid.category} • ${Math.round(block.withKid.duration)} min`);
            }

            // Without kid column
            const withoutKidDiv = comparisonDiv.append('div')
                .style('padding', '15px')
                .style('background', 'rgba(141, 166, 80, 0.1)')
                .style('border-radius', '10px')
                .style('border-left', '4px solid #8DA650');

            withoutKidDiv.append('h4')
                .style('margin-bottom', '10px')
                .style('color', '#8DA650')
                .text('Without Kid');

            if (block.withoutKid) {
                withoutKidDiv.append('p')
                    .style('font-size', '0.9rem')
                    .style('line-height', '1.4')
                    .style('color', '#555')
                    .text(block.withoutKid.activity);
                
                withoutKidDiv.append('small')
                    .style('color', '#777')
                    .style('font-size', '0.8rem')
                    .text(`${block.withoutKid.category} • ${Math.round(block.withoutKid.duration)} min`);
            }

            // Add insight if activities are different
            if (block.withKid && block.withoutKid && 
                block.withKid.activity !== block.withoutKid.activity) {
                contentDiv.append('div')
                    .style('margin-top', '20px')
                    .style('padding', '15px')
                    .style('background', 'rgba(230, 236, 156, 0.3)')
                    .style('border-radius', '10px')
                    .style('font-size', '0.9rem')
                    .style('color', '#666')
                    .html(`<strong>Key Difference:</strong> ${this.generateInsight(block)}`);
            }
        });
    }

    generateInsight(block) {
        if (!block.withKid || !block.withoutKid) return '';
        
        const withKid = block.withKid;
        const withoutKid = block.withoutKid;
        
        // Generate contextual insights
        if (withKid.category === 'Kid' && withoutKid.category !== 'Kid') {
            return 'Time spent on child-related activities instead of other pursuits.';
        } else if (withKid.category === 'Work' && withoutKid.category === 'Self') {
            return 'Work responsibilities continue even during personal time.';
        } else if (withKid.category === 'Self' && withoutKid.category === 'Work') {
            return 'Less work flexibility allows for more personal time.';
        } else if (withKid.duration > withoutKid.duration) {
            return 'Activity takes longer when managing child responsibilities.';
        } else if (withKid.duration < withoutKid.duration) {
            return 'Activity is more efficient when child is not present.';
        }
        
        return 'Different priorities and time allocation patterns.';
    }

    setupScrollama() {
        // Initialize Scrollama
        this.scroller = scrollama();

        this.scroller
            .setup({
                step: '.step',
                offset: 0.5,
                debug: false
            })
            .onStepEnter(this.onStepEnter.bind(this))
            .onStepExit(this.onStepExit.bind(this));

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    onStepEnter(response) {
        const { element, index, direction } = response;
        const stepType = element.getAttribute('data-step');
        
        console.log('Step enter:', stepType, 'index:', index, 'direction:', direction);
        
        // Update step appearance
        d3.selectAll('.step').classed('active', false);
        d3.select(element).classed('active', true);

        if (stepType === 'intro') {
            // Introduction step - show empty timeline
            timelineViz.updateVisualization('intro');
            
        } else if (stepType === 'complete') {
            // Complete timeline step - show all blocks
            timelineViz.updateVisualization('complete');
            
        } else if (stepType.startsWith('time-')) {
            // Time step - update visualization
            const timeIndex = parseInt(stepType.split('-')[1]);
            this.currentStepIndex = timeIndex;
            
            if (timeIndex >= 0 && timeIndex < this.scrollBlocks.length) {
                timelineViz.updateVisualization(timeIndex);
            }
        }
    }

    onStepExit(response) {
        const { element, index, direction } = response;
        
        // Remove active class when exiting
        if (direction === 'up') {
            d3.select(element).classed('active', false);
        }
    }

    handleResize() {
        // Resize Scrollama on window resize
        if (this.scroller) {
            this.scroller.resize();
        }
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    // Public methods for external control
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.scrollBlocks.length) {
            this.currentStepIndex = stepIndex;
            timelineViz.updateVisualization(stepIndex);
        }
    }

    getCurrentStep() {
        return this.currentStepIndex;
    }

    getTotalSteps() {
        return this.scrollBlocks ? this.scrollBlocks.length : 0;
    }
}

// Global instance
const scrollController = new ScrollController();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing scroll controller...');
    
    // Show loading message
    d3.select('#current-time').text('Loading...');
    

    
    scrollController.init().then(() => {
        console.log('Scroll controller ready!');
        console.log('Total steps:', scrollController.getTotalSteps());
        
        // Test if data loaded correctly
        const data = timelineData.getScrollBlocks();
        console.log('Scroll blocks available:', data ? data.length : 0);
        
        if (data && data.length > 0) {
            console.log('First 5 scroll blocks:');
            data.slice(0, 5).forEach((block, i) => {
                console.log(`  ${i}: ${block.timeString} - With Kid: ${block.withKid ? block.withKid.activity : 'N/A'} | Without Kid: ${block.withoutKid ? block.withoutKid.activity : 'N/A'}`);
            });
            
            console.log('Sample mid-day blocks (around index 15-20):');
            data.slice(15, 20).forEach((block, i) => {
                console.log(`  ${i+15}: ${block.timeString} - With Kid: ${block.withKid ? block.withKid.activity : 'N/A'} | Without Kid: ${block.withoutKid ? block.withoutKid.activity : 'N/A'}`);
            });
        }
        
        if (data && data.length > 0) {
            d3.select('#current-time').text('Ready to scroll!');
        } else {
            d3.select('#current-time').text('Data loading failed');
            console.error('No scroll blocks available');
        }
        
    }).catch(error => {
        console.error('Failed to initialize scroll controller:', error);
        d3.select('#current-time').text('Error loading');
    });
});

// Add some utility functions for debugging
window.debugTimeline = {
    goToStep: (index) => scrollController.goToStep(index),
    getCurrentStep: () => scrollController.getCurrentStep(),
    getTotalSteps: () => scrollController.getTotalSteps(),
    showGridPlot: () => timelineViz.showGridPlot(),
    reset: () => timelineViz.reset(),
    getData: () => timelineData.getScrollBlocks(),
    getSummary: () => timelineData.getSummary()
};
