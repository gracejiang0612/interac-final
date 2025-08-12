// Main controller for the stacked timeline visualization
class VisualizationController {
    constructor() {
        this.data = null;
        this.stackedChart = null;
        this.gridPlot = null;
        this.isGridMode = false;
        this.transformButton = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing visualization controller...');
        
        try {
            // Load data
            console.log('Starting data load...');
            this.data = await dataProcessor.loadData();
            console.log('Data load result:', this.data);
            
            if (!this.data) {
                console.error('Data is null, forcing fallback...');
                this.data = dataProcessor.loadFallbackData();
            }
            
            if (!this.data) {
                throw new Error('Failed to load data and fallback failed');
            }
            
            // Initialize visualizations
            this.stackedChart = new StackedChart('#main-svg');
            this.gridPlot = new GridPlot('#main-svg');
            this.gridPlot.init();
            
            // Setup UI
            this.setupControls();
            this.updateInfoPanel();
            
            // Render initial chart
            this.stackedChart.render(this.data.summary);
            this.gridPlot.render(this.data.detailed);
            
            console.log('Visualization ready!');
            
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
            
            // Try to force fallback data as last resort
            try {
                console.log('Attempting emergency fallback...');
                this.data = dataProcessor.loadFallbackData();
                
                if (this.data) {
                    // Initialize visualizations with fallback data
                    this.stackedChart = new StackedChart('#main-svg');
                    this.gridPlot = new GridPlot('#main-svg');
                    this.gridPlot.init();
                    
                    // Setup UI
                    this.setupControls();
                    this.updateInfoPanel();
                    
                    // Render initial chart
                    this.stackedChart.render(this.data.summary);
                    this.gridPlot.render(this.data.detailed);
                    
                    console.log('Emergency fallback successful!');
                    return;
                }
            } catch (fallbackError) {
                console.error('Emergency fallback also failed:', fallbackError);
            }
            
            this.showError('Failed to load data. Using emergency mode with sample data.');
            this.showEmergencyMode();
        }
    }

    setupControls() {
        this.transformButton = document.getElementById('transform-btn');
        
        if (!this.transformButton) {
            console.error('Transform button not found');
            return;
        }
        
        this.transformButton.addEventListener('click', () => {
            this.toggleVisualization();
        });
    }

    toggleVisualization() {
        if (this.isGridMode) {
            this.showStackedChart();
        } else {
            this.showGridPlot();
        }
    }

    showGridPlot() {
        console.log('Switching to grid plot...');
        
        this.isGridMode = true;
        this.transformButton.classList.add('transforming');
        this.transformButton.querySelector('.btn-text').textContent = 'Back to Summary';
        this.transformButton.querySelector('.btn-icon').textContent = '←';
        
        // Get rectangle positions for smooth transition
        const chartRects = this.stackedChart.getRectangleData();
        
        // Hide chart and show grid
        this.stackedChart.hide();
        this.gridPlot.transformFromChart(chartRects);
        
        // Update button state
        setTimeout(() => {
            this.transformButton.classList.remove('transforming');
        }, 1500);
    }

    showStackedChart() {
        console.log('Switching to stacked chart...');
        
        this.isGridMode = false;
        this.transformButton.classList.add('transforming');
        this.transformButton.querySelector('.btn-text').textContent = 'See Full Time Distribution';
        this.transformButton.querySelector('.btn-icon').textContent = '→';
        
        // Hide grid and show chart
        this.gridPlot.transformToChart();
        
        setTimeout(() => {
            this.stackedChart.show();
            this.stackedChart.reset();
        }, 500);
        
        // Update button state
        setTimeout(() => {
            this.transformButton.classList.remove('transforming');
        }, 1500);
    }

    updateInfoPanel() {
        const stats = dataProcessor.getStatistics();
        const comparisons = dataProcessor.getComparisons();
        
        if (!stats) return;
        
        // Update with kid stats
        this.updateStatsSection('with-kid-stats', stats.withKid, 'With Kid');
        
        // Update without kid stats
        this.updateStatsSection('without-kid-stats', stats.withoutKid, 'Without Kid');
        
        // Log comparisons for insights
        console.log('Time allocation comparisons:', comparisons);
    }

    updateStatsSection(elementId, timelineStats, label) {
        const container = document.getElementById(elementId);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Add total time
        const totalDiv = document.createElement('div');
        totalDiv.className = 'stat-item';
        totalDiv.innerHTML = `
            <span class="stat-label">Total Time:</span>
            <span class="stat-value">${dataProcessor.formatTime(timelineStats.total)}</span>
        `;
        container.appendChild(totalDiv);
        
        // Add category breakdown
        Object.entries(timelineStats.categories).forEach(([category, data]) => {
            const statDiv = document.createElement('div');
            statDiv.className = 'stat-item';
            statDiv.innerHTML = `
                <span class="stat-label">${category}:</span>
                <span class="stat-value">${dataProcessor.formatTime(data.hours)} (${dataProcessor.formatPercentage(data.percentage)})</span>
            `;
            container.appendChild(statDiv);
        });
        
        // Add insights
        const insights = this.generateInsights(timelineStats, label);
        if (insights) {
            const insightDiv = document.createElement('div');
            insightDiv.className = 'stat-insight';
            insightDiv.style.cssText = 'margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px; font-size: 0.85rem; color: #555;';
            insightDiv.innerHTML = `<strong>Key Insight:</strong> ${insights}`;
            container.appendChild(insightDiv);
        }
    }

    generateInsights(timelineStats, label) {
        const categories = timelineStats.categories;
        const maxCategory = Object.entries(categories).reduce((max, [key, value]) => 
            value.hours > max.value ? { key, value: value.hours } : max, 
            { key: '', value: 0 }
        );
        
        if (label === 'With Kid') {
            if (categories.Kid && categories.Kid.hours > 0) {
                return `Spends ${dataProcessor.formatTime(categories.Kid.hours)} on child-related activities, with ${maxCategory.key.toLowerCase()} taking up the most time overall.`;
            } else {
                return `${maxCategory.key} activities dominate the schedule at ${dataProcessor.formatTime(maxCategory.value)}.`;
            }
        } else {
            return `Without child responsibilities, ${maxCategory.key.toLowerCase()} activities account for ${dataProcessor.formatTime(maxCategory.value)} of the day.`;
        }
    }

    showError(message) {
        const container = document.querySelector('.viz-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #e74c3c;">
                <h3>Error Loading Visualization</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>
            </div>
        `;
    }

    showEmergencyMode() {
        const container = document.querySelector('.viz-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <h3>Sample Data Visualization</h3>
                <p style="margin-bottom: 30px; color: #666;">Showing example data structure for working mother's time allocation</p>
                
                <div style="display: flex; justify-content: space-around; margin: 40px 0;">
                    <div style="text-align: center;">
                        <h4>With Kid</h4>
                        <div style="width: 100px; height: 200px; background: linear-gradient(to top, #DE4764 0%, #DE4764 30%, #8DA650 30%, #8DA650 70%, #E6EC9C 70%, #E6EC9C 100%); margin: 20px auto; border-radius: 5px;"></div>
                        <div style="font-size: 12px; color: #666;">
                            <div>💤 Sleep: 7h</div>
                            <div>👩‍💼 Work: 8h</div>
                            <div>👶 Kid: 5h</div>
                            <div>💆‍♀️ Self: 4h</div>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <h4>Without Kid</h4>
                        <div style="width: 100px; height: 200px; background: linear-gradient(to top, #DE4764 0%, #DE4764 30%, #8DA650 30%, #8DA650 80%, #DE4764 80%, #DE4764 100%); margin: 20px auto; border-radius: 5px;"></div>
                        <div style="font-size: 12px; color: #666;">
                            <div>💤 Sleep: 7h</div>
                            <div>👩‍💼 Work: 12h</div>
                            <div>👶 Kid: 0h</div>
                            <div>💆‍♀️ Self: 5h</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <h4>Key Insight</h4>
                    <p>Without child responsibilities, more time is available for work and self-care. With a child, time is redistributed to include child-related activities, often at the expense of work hours and personal time.</p>
                </div>
                
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer;">Try Loading Again</button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, checking dependencies...');
    
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded!');
        document.querySelector('.viz-container').innerHTML = `
            <div style="text-align: center; padding: 50px; color: #e74c3c;">
                <h3>D3.js Library Not Found</h3>
                <p>The D3.js library failed to load. Please check your internet connection.</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>
            </div>
        `;
        return;
    }
    
    console.log('D3.js loaded successfully, version:', d3.version);
    console.log('Initializing visualization controller...');
    
    try {
        new VisualizationController();
    } catch (error) {
        console.error('Failed to create VisualizationController:', error);
        
        // Show emergency mode directly
        const container = document.querySelector('.viz-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <h3>Sample Data Visualization</h3>
                    <p style="margin-bottom: 30px; color: #666;">Showing example data structure for working mother's time allocation</p>
                    
                    <div style="display: flex; justify-content: space-around; margin: 40px 0;">
                        <div style="text-align: center;">
                            <h4>With Kid</h4>
                            <div style="width: 100px; height: 200px; background: linear-gradient(to top, #DE4764 0%, #DE4764 30%, #8DA650 30%, #8DA650 70%, #E6EC9C 70%, #E6EC9C 100%); margin: 20px auto; border-radius: 5px;"></div>
                            <div style="font-size: 12px; color: #666;">
                                <div>💤 Sleep: 7h</div>
                                <div>👩‍💼 Work: 8h</div>
                                <div>👶 Kid: 5h</div>
                                <div>💆‍♀️ Self: 4h</div>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <h4>Without Kid</h4>
                            <div style="width: 100px; height: 200px; background: linear-gradient(to top, #DE4764 0%, #DE4764 30%, #8DA650 30%, #8DA650 80%, #DE4764 80%, #DE4764 100%); margin: 20px auto; border-radius: 5px;"></div>
                            <div style="font-size: 12px; color: #666;">
                                <div>💤 Sleep: 7h</div>
                                <div>👩‍💼 Work: 12h</div>
                                <div>👶 Kid: 0h</div>
                                <div>💆‍♀️ Self: 5h</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <h4>Key Insight</h4>
                        <p>Without child responsibilities, more time is available for work and self-care. With a child, time is redistributed to include child-related activities, often at the expense of work hours and personal time.</p>
                    </div>
                    
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer;">Try Loading Again</button>
                </div>
            `;
        }
    }
});

// Add some utility functions for debugging
window.debugViz = {
    data: () => dataProcessor,
    controller: () => window.vizController,
    toggleMode: () => window.vizController && window.vizController.toggleVisualization(),
    testCSV: async () => {
        try {
            console.log('Testing CSV loading...');
            const csvData = await d3.csv('working-mom-data-cleaned.csv');
            console.log('CSV test successful:', csvData.length, 'rows');
            console.log('First row:', csvData[0]);
            return csvData;
        } catch (error) {
            console.error('CSV test failed:', error);
            return null;
        }
    },
    loadFallback: () => {
        console.log('Loading fallback data...');
        dataProcessor.loadFallbackData();
    }
};
