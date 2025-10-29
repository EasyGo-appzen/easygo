// Main application
const app = {
    chartData: null,
    plotlyChart: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
        // Scroll to top on page load
        window.scrollTo(0, 0);
    },
    
    cacheElements() {
        this.uploadForm = document.getElementById('uploadForm');
        this.chartDiv = document.getElementById('chart');
        this.lineChartDiv = document.getElementById('lineChart');
        this.pieChartDiv = document.getElementById('pieChart');
        this.summaryDiv = document.getElementById('summary');
        this.exportPngBtn = document.getElementById('exportPng');
        this.exportCsvBtn = document.getElementById('exportCsv');
        this.themeSelector = document.getElementById('themeSelector');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.modelSearch = document.getElementById('modelSearch');
        this.searchResults = document.getElementById('searchResults');
        this.top5Models = document.getElementById('top5Models');
        this.comparisonTable = document.getElementById('comparisonTable');
        this.expenseTypesTable = document.getElementById('expenseTypesTable');
        this.searchContainer = document.getElementById('searchContainer');
        this.top5Container = document.getElementById('top5Container');
        this.pieContainer = document.getElementById('pieContainer');
        this.comparisonContainer = document.getElementById('comparisonContainer');
        this.expenseTypesContainer = document.getElementById('expenseTypesContainer');
    },
    
    bindEvents() {
        if (this.uploadForm) {
            this.uploadForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        if (this.themeSelector) {
            this.themeSelector.addEventListener('change', () => {
                if (this.chartData) {
                    this.updateChart(this.chartData, this.themeSelector.value);
                    this.updateLineChart(this.chartData, this.themeSelector.value);
                    this.updatePieChart(this.chartData, this.themeSelector.value);
                }
            });
        }
        
        if (this.modelSearch) {
            this.modelSearch.addEventListener('input', (e) => {
                this.searchModels(e.target.value);
            });
        }
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Tab + ` to open file selector
            if (e.key === '`' && e.shiftKey === false && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const fileInput = document.getElementById('csvFile');
                if (fileInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    fileInput.click();
                }
            }
            
            // Enter to submit form (when not in input fields)
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (document.activeElement.tagName !== 'INPUT' && 
                    document.activeElement.tagName !== 'TEXTAREA' && 
                    document.activeElement.tagName !== 'SELECT') {
                    const uploadBtn = this.uploadForm?.querySelector('button[type="submit"]');
                    if (uploadBtn && !uploadBtn.disabled) {
                        e.preventDefault();
                        uploadBtn.click();
                    }
                }
            }
        });
    },
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.uploadForm);
        formData.append('theme', this.themeSelector.value);
        
        try {
            this.loadingIndicator.classList.remove('d-none');
            
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to process file');
            }
            
            const data = await response.json();
            this.chartData = data;
            
            // Show notification if multiple files were processed
            if (data.filesProcessed && data.filesProcessed > 1) {
                alert(`✅ Successfully processed ${data.filesProcessed} CSV files! All data has been combined.`);
            }
            
            // Update all charts and features
            this.updateChart(data, this.themeSelector.value);
            this.updateLineChart(data, this.themeSelector.value);
            this.updatePieChart(data, this.themeSelector.value);
            this.updateTop5Models(data);
            this.updateComparisonTable(data);
            this.updateExpenseTypesTable(data);
            
            // Show all containers
            if (this.searchContainer) this.searchContainer.style.display = 'block';
            if (this.top5Container) this.top5Container.style.display = 'block';
            if (this.pieContainer) this.pieContainer.style.display = 'block';
            if (this.comparisonContainer) this.comparisonContainer.style.display = 'block';
            if (this.expenseTypesContainer) this.expenseTypesContainer.style.display = 'block';
            
            // Enable export buttons if they exist
            if (this.exportPngBtn) this.exportPngBtn.disabled = false;
            if (this.exportCsvBtn) this.exportCsvBtn.disabled = false;
            
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing the file. Please check the console for details.');
        } finally {
            this.loadingIndicator.classList.add('d-none');
        }
    },
    
    updateChart(data, theme = 'default') {
        const { models, datasets } = data;
        
        if (!this.chartDiv) {
            console.error('Chart container not found');
            return;
        }
        
        if (datasets.length === 0 || models.length === 0) {
            this.chartDiv.innerHTML = '<p class="text-muted text-center py-5">No data available for the selected criteria.</p>';
            return;
        }
        
        // Calculate optimal bar width based on number of models
        const numModels = models.length;
        const optimalBarWidth = numModels > 15 ? 0.7 : numModels > 10 ? 0.6 : 0.5;
        
        const traces = datasets.map(dataset => {
            // Only include non-zero data points
            const nonZeroData = dataset.data.filter(amount => amount > 0);
            const nonZeroModels = models.filter((_, i) => dataset.data[i] > 0);
            
            return {
                x: nonZeroModels,
                y: nonZeroData,
                name: dataset.label,
                type: 'bar',
                width: optimalBarWidth,
                text: [],
                textposition: 'none',
                hoverinfo: 'text+name+y',
                hoverlabel: { 
                    bgcolor: '#fff',
                    font: { 
                        size: 12,
                        family: 'Arial, sans-serif'
                    }
                },
                hovertemplate: 
                    '<b>%{x}</b><br>' +
                    '<b>%{data.name}</b><br>' +
                    'Amount: <b>$%{y:,.2f}</b><br>' +
                    'Reports: <b>%{customdata}</b><br>' +
                    '<extra></extra>',
                customdata: dataset.count.filter((_, i) => dataset.data[i] > 0),
                marker: { 
                    color: dataset.backgroundColor,
                    line: {
                        color: '#000000',
                        width: 2
                    },
                    opacity: 0.92,
                    pattern: {
                        shape: ''
                    }
                }
            };
        }).filter(trace => trace.y.length > 0);
        
        if (traces.length === 0) {
            this.chartDiv.innerHTML = '<p class="text-muted text-center py-5">No data available for the selected criteria.</p>';
            return;
        }
        
        // Calculate the number of unique x-axis values (bars)
        const numBars = Math.max(...traces.map(trace => trace.x.length));
        
        // Dynamically adjust chart height based on number of bars and data magnitude
        const baseHeight = 600;
        const heightPerBar = numBars > 10 ? 30 : 50;
        const dynamicHeight = Math.max(baseHeight, 400 + (numBars * heightPerBar));
        
        // Update chart div height dynamically
        this.chartDiv.style.height = `${dynamicHeight}px`;
        
        // Calculate totals for each model (for stacked bars)
        const modelTotals = {};
        models.forEach((model, idx) => {
            let total = 0;
            datasets.forEach(dataset => {
                if (dataset.data[idx] > 0) {
                    total += dataset.data[idx];
                }
            });
            if (total > 0) {
                modelTotals[model] = total;
            }
        });
        
        // Create annotations for totals at the top of each bar
        const annotations = Object.keys(modelTotals).map(model => ({
            x: model,
            y: modelTotals[model],
            text: `<b>$${modelTotals[model].toLocaleString(undefined, {maximumFractionDigits: 2})}</b>`,
            xanchor: 'center',
            yanchor: 'bottom',
            showarrow: false,
            font: {
                size: 14,
                family: 'Arial Black, Arial, sans-serif',
                color: '#000000',
                weight: 'bold'
            },
            yshift: 5
        }));
        
        const layout = {
            barmode: 'stack',
            bargap: 0.2,
            bargroupgap: 0.1,
            autosize: true,
            title: {
                text: '<b>Reimbursement by Model and CVM Analysis</b>',
                font: { 
                    size: 20,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                }
            },
            xaxis: { 
                title: {
                    text: '<b>Model Name</b>',
                    font: {
                        size: 16,
                        family: 'Arial, sans-serif',
                        weight: 'bold',
                        color: '#000000'
                    }
                },
                tickangle: 0,  // Horizontal labels
                automargin: true,
                tickfont: {
                    size: 14,
                    family: 'Arial Black, Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                },
                type: 'category'  // Ensures all categories are shown
            },
            yaxis: { 
                title: {
                    text: '<b>Total Reimbursement (USD)</b>',
                    font: {
                        size: 16,
                        family: 'Arial, sans-serif',
                        weight: 'bold',
                        color: '#000000'
                    }
                },
                automargin: true,
                rangemode: 'tozero',  // Start from zero and auto-scale to fit all data
                gridcolor: 'rgba(0,0,0,0.15)',
                gridwidth: 1,
                zeroline: true,
                zerolinecolor: 'rgba(0,0,0,0.3)',
                zerolinewidth: 2,
                tickfont: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                }
            },
            legend: { 
                orientation: 'h',
                y: -0.15,
                x: 0.5,
                xanchor: 'center',
                yanchor: 'top',
                font: { 
                    size: 13,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#000000',
                borderwidth: 1
            },
            margin: { 
                l: 100,  // Increased left margin for y-axis labels
                r: 50,   // Increased right margin
                b: 100,  // Bottom margin for x-axis labels and legend
                t: 80,   // Top margin for title
                pad: 10 
            },
            plot_bgcolor: '#FFFFFF',
            paper_bgcolor: '#FFFFFF',
            showlegend: traces.length > 1,
            uniformtext: {
                mode: 'hide',  // Hide text if it doesn't fit
                minsize: 9
            },
            hovermode: 'closest',
            bargap: 0.15,
            bargroupgap: 0.1,
            annotations: annotations
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'cvm_analysis_chart',
                height: 1000,
                width: 1600,
                scale: 3
            }
        };
        
        // Clear previous chart if it exists
        if (this.plotlyChart) {
            Plotly.purge(this.chartDiv);
        }
        
        // Track which model's info is currently shown
        let currentlyShownModel = null;
        
        // Store original data for each trace to restore later
        const originalText = traces.map(trace => [...trace.text]);
        const originalY = traces.map(trace => [...trace.y]);
        
        // Create new chart with config
        this.plotlyChart = Plotly.newPlot(this.chartDiv, traces, layout, config)
            .then(() => {
                // Add click event to toggle info box for all CVM types
                this.chartDiv.on('plotly_click', (eventData) => {
                    if (eventData.points && eventData.points.length > 0) {
                        const point = eventData.points[0];
                        const clickedModel = point.x;
                        
                        // If clicking the same model, toggle off
                        if (currentlyShownModel === clickedModel) {
                            currentlyShownModel = null;
                            
                            // Reset opacity for all traces
                            const opacityReset = traces.map(() => 0.92);
                            
                            // Restore original text for all bars
                            const textReset = originalText;
                            
                            // Reset bar width
                            const widthReset = traces.map(() => optimalBarWidth);
                            
                            // Reset text font to original
                            const textFontReset = traces.map(() => 
                                traces[0].x.map(() => ({
                                    size: 11,
                                    family: 'Arial, sans-serif',
                                    weight: 'bold'
                                }))
                            );
                            
                            Plotly.restyle(this.chartDiv, {
                                'marker.opacity': opacityReset,
                                'text': textReset,
                                'width': widthReset,
                                'textfont': textFontReset
                            });
                            Plotly.relayout(this.chartDiv, {
                                annotations: annotations
                            });
                            return;
                        }
                        
                        // Update currently shown model
                        currentlyShownModel = clickedModel;
                        
                        // Find all data for this model across all datasets
                        const modelIndex = models.indexOf(clickedModel);
                        const modelData = datasets.map(dataset => ({
                            name: dataset.label,
                            amount: dataset.data[modelIndex] || 0,
                            count: dataset.count[modelIndex] || 0,
                            color: dataset.backgroundColor
                        })).filter(d => d.amount > 0);
                        
                        // Calculate total for this model
                        const totalAmount = modelData.reduce((sum, d) => sum + d.amount, 0);
                        const totalCount = modelData.reduce((sum, d) => sum + d.count, 0);
                        
                        // Create detailed info box text
                        let infoText = `<b>${clickedModel}</b><br>` +
                                      `<b>Total: $${totalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</b><br>` +
                                      `<b>Total Reports: ${totalCount}</b><br>` +
                                      `<br>`;
                        
                        modelData.forEach(d => {
                            infoText += `<b>${d.name}:</b> $${d.amount.toLocaleString(undefined, {maximumFractionDigits: 2})} (${d.count} reports)<br>`;
                        });
                        
                        // Create annotation without arrow but with prominent black outline
                        const clickAnnotation = {
                            x: clickedModel,
                            y: totalAmount,
                            text: infoText,
                            xanchor: 'center',
                            yanchor: 'bottom',
                            showarrow: false,
                            bgcolor: 'rgba(255, 255, 255, 0.98)',
                            bordercolor: '#000000',
                            borderwidth: 5,
                            borderpad: 15,
                            font: {
                                size: 14,
                                family: 'Arial Black, Arial, sans-serif',
                                color: '#000',
                                weight: 'bold'
                            },
                            captureevents: true,
                            yshift: 15,
                            opacity: 1.0
                        };
                        
                        // Filter annotations to hide the total amount for clicked model
                        const filteredAnnotations = annotations.filter(ann => ann.x !== clickedModel);
                        const newAnnotations = [...filteredAnnotations, clickAnnotation];
                        
                        // Update opacity: reduce for other bars, keep full for clicked bar
                        const opacityUpdates = traces.map((trace, idx) => {
                            const traceOpacities = trace.x.map(xVal => 
                                xVal === clickedModel ? 0.92 : 0.3
                            );
                            return traceOpacities;
                        });
                        
                        // Hide text inside other bars, keep text for clicked bar
                        const textUpdates = traces.map((trace, idx) => {
                            return trace.x.map((xVal, i) => 
                                xVal === clickedModel ? trace.text[i] : ''
                            );
                        });
                        
                        // Increase width for clicked bar
                        const widthUpdates = traces.map((trace, idx) => {
                            return trace.x.map(xVal => 
                                xVal === clickedModel ? optimalBarWidth * 1.3 : optimalBarWidth
                            );
                        });
                        
                        // Update text size for clicked bar
                        const textFontUpdates = traces.map((trace, idx) => {
                            return trace.x.map(xVal => ({
                                size: xVal === clickedModel ? 16 : 11,
                                family: 'Arial Black, Arial, sans-serif',
                                weight: 'bold'
                            }));
                        });
                        
                        Plotly.restyle(this.chartDiv, {
                            'marker.opacity': opacityUpdates,
                            'text': textUpdates,
                            'width': widthUpdates,
                            'textfont': textFontUpdates
                        });
                        
                        Plotly.relayout(this.chartDiv, {
                            annotations: newAnnotations
                        });
                    }
                });
            });
    },
    
    updateLineChart(data, theme = 'default') {
        const { models, datasets } = data;
        
        if (!this.lineChartDiv) {
            console.error('Line chart container not found');
            return;
        }
        
        if (datasets.length === 0 || models.length === 0) {
            this.lineChartDiv.innerHTML = '<p class="text-muted text-center py-5">No data available for the selected criteria.</p>';
            return;
        }
        
        // Find TPOS and FPOS datasets
        const tposData = datasets.find(d => d.label === 'TPOS');
        const fposData = datasets.find(d => d.label === 'FPOS');
        
        if (!tposData || !fposData) {
            this.lineChartDiv.innerHTML = '<p class="text-muted text-center py-5">TPOS or FPOS data not available.</p>';
            return;
        }
        
        // Create line traces
        const traces = [
            {
                x: models,
                y: tposData.data,
                name: 'TPOS',
                type: 'scatter',
                mode: 'lines+markers',
                line: {
                    color: tposData.backgroundColor,
                    width: 4,
                    shape: 'spline'
                },
                marker: {
                    size: 10,
                    color: tposData.backgroundColor,
                    line: {
                        color: '#000000',
                        width: 2
                    }
                },
                hovertemplate: '<b>%{x}</b><br>TPOS: <b>$%{y:,.2f}</b><extra></extra>'
            },
            {
                x: models,
                y: fposData.data,
                name: 'FPOS',
                type: 'scatter',
                mode: 'lines+markers',
                line: {
                    color: fposData.backgroundColor,
                    width: 4,
                    shape: 'spline'
                },
                marker: {
                    size: 10,
                    color: fposData.backgroundColor,
                    line: {
                        color: '#000000',
                        width: 2
                    }
                },
                hovertemplate: '<b>%{x}</b><br>FPOS: <b>$%{y:,.2f}</b><extra></extra>'
            }
        ];
        
        const layout = {
            title: {
                text: '<b>TPOS vs FPOS Amount Comparison</b>',
                font: {
                    size: 18,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                }
            },
            xaxis: {
                title: {
                    text: '<b>Model Name</b>',
                    font: {
                        size: 14,
                        family: 'Arial, sans-serif',
                        weight: 'bold',
                        color: '#000000'
                    }
                },
                tickangle: 0,
                automargin: true,
                tickfont: {
                    size: 11,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                }
            },
            yaxis: {
                title: {
                    text: '<b>Amount (USD)</b>',
                    font: {
                        size: 14,
                        family: 'Arial, sans-serif',
                        weight: 'bold',
                        color: '#000000'
                    }
                },
                gridcolor: 'rgba(0,0,0,0.15)',
                gridwidth: 1,
                zeroline: true,
                zerolinecolor: 'rgba(0,0,0,0.3)',
                zerolinewidth: 2,
                tickfont: {
                    size: 11,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                }
            },
            legend: {
                orientation: 'v',
                y: 0.5,
                x: 1.02,
                xanchor: 'left',
                yanchor: 'middle',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#000000',
                borderwidth: 2
            },
            plot_bgcolor: '#FFFFFF',
            paper_bgcolor: '#FFFFFF',
            hovermode: 'x unified',
            margin: {
                l: 80,
                r: 120,
                b: 100,
                t: 80,
                pad: 10
            }
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'tpos_vs_fpos_comparison',
                height: 800,
                width: 1600,
                scale: 3
            }
        };
        
        Plotly.newPlot(this.lineChartDiv, traces, layout, config);
    },
    
    updatePieChart(data, theme = 'default') {
        const { datasets } = data;
        
        if (!this.pieChartDiv) {
            console.error('Pie chart container not found');
            return;
        }
        
        if (datasets.length === 0) {
            this.pieChartDiv.innerHTML = '<p class="text-muted text-center py-5">No data available.</p>';
            return;
        }
        
        // Calculate total amounts for each CVM type
        const cvmTotals = {};
        const cvmColors = {};
        
        datasets.forEach(dataset => {
            const total = dataset.data.reduce((sum, val) => sum + val, 0);
            if (total > 0) {
                cvmTotals[dataset.label] = total;
                cvmColors[dataset.label] = dataset.backgroundColor;
            }
        });
        
        const labels = Object.keys(cvmTotals);
        const values = Object.values(cvmTotals);
        const colors = labels.map(label => cvmColors[label]);
        
        const trace = {
            labels: labels,
            values: values,
            type: 'pie',
            marker: {
                colors: colors,
                line: {
                    color: '#000000',
                    width: 2
                }
            },
            textinfo: 'label+percent+value',
            texttemplate: '<b>%{label}</b><br>%{percent}<br>$%{value:,.2f}',
            hovertemplate: '<b>%{label}</b><br>Amount: <b>$%{value:,.2f}</b><br>Percentage: <b>%{percent}</b><extra></extra>',
            textfont: {
                size: 14,
                family: 'Arial, sans-serif',
                weight: 'bold',
                color: '#000000'
            }
        };
        
        const layout = {
            title: {
                text: '<b>CVM Type Distribution</b>',
                font: {
                    size: 18,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                }
            },
            showlegend: true,
            legend: {
                orientation: 'v',
                y: 0.5,
                x: 1.02,
                xanchor: 'left',
                yanchor: 'middle',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    weight: 'bold',
                    color: '#000000'
                },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#000000',
                borderwidth: 2
            },
            paper_bgcolor: '#FFFFFF',
            margin: {
                l: 50,
                r: 150,
                b: 50,
                t: 80,
                pad: 10
            }
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'cvm_distribution_pie_chart',
                height: 800,
                width: 1200,
                scale: 3
            }
        };
        
        Plotly.newPlot(this.pieChartDiv, [trace], layout, config);
    },
    
    updateTop5Models(data) {
        const { models, datasets } = data;
        
        if (!this.top5Models) return;
        
        // Calculate total reimbursement for each model
        const modelTotals = models.map((model, idx) => {
            let total = 0;
            let breakdown = {};
            
            datasets.forEach(dataset => {
                const amount = dataset.data[idx] || 0;
                if (amount > 0) {
                    total += amount;
                    breakdown[dataset.label] = {
                        amount: amount,
                        count: dataset.count[idx] || 0
                    };
                }
            });
            
            return { model, total, breakdown };
        });
        
        // Sort by total and get top 5
        const top5 = modelTotals
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        
        // Create HTML for top 5 models
        let html = '<div class="row">';
        
        top5.forEach((item, index) => {
            const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
            
            html += `
                <div class="col-12 mb-3">
                    <div class="card" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border: 2px solid rgba(102, 126, 234, 0.3);">
                        <div class="card-body">
                            <h3 class="h5">${medal} ${item.model}</h3>
                            <p class="h4 text-primary mb-3">$${item.total.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                            <div class="row">
            `;
            
            Object.keys(item.breakdown).forEach(cvmType => {
                const cvmData = item.breakdown[cvmType];
                html += `
                    <div class="col-md-3 col-6 mb-2">
                        <div class="text-muted small">${cvmType}</div>
                        <div class="fw-bold">$${cvmData.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                        <div class="text-muted small">${cvmData.count} reports</div>
                    </div>
                `;
            });
            
            html += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        this.top5Models.innerHTML = html;
    },
    
    updateComparisonTable(data) {
        const { models, datasets } = data;
        
        if (!this.comparisonTable) return;
        
        // Create comparison table
        let html = `
            <table class="table table-striped table-hover" style="background: white;">
                <thead style="position: sticky; top: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; z-index: 10;">
                    <tr>
                        <th style="min-width: 150px;">Model Name</th>
        `;
        
        datasets.forEach(dataset => {
            html += `<th class="text-center">${dataset.label}<br><small>Amount</small></th>`;
            html += `<th class="text-center">${dataset.label}<br><small>Reports</small></th>`;
        });
        
        html += `<th class="text-center">Total<br><small>Amount</small></th>`;
        html += `<th class="text-center">Total<br><small>Reports</small></th>`;
        html += `</tr></thead><tbody>`;
        
        models.forEach((model, idx) => {
            let totalAmount = 0;
            let totalReports = 0;
            
            html += `<tr><td class="fw-bold">${model}</td>`;
            
            datasets.forEach(dataset => {
                const amount = dataset.data[idx] || 0;
                const count = dataset.count[idx] || 0;
                totalAmount += amount;
                totalReports += count;
                
                html += `<td class="text-end">${amount > 0 ? '$' + amount.toLocaleString(undefined, {maximumFractionDigits: 2}) : '-'}</td>`;
                html += `<td class="text-center">${count > 0 ? count : '-'}</td>`;
            });
            
            html += `<td class="text-end fw-bold" style="background: rgba(102, 126, 234, 0.1);">$${totalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>`;
            html += `<td class="text-center fw-bold" style="background: rgba(102, 126, 234, 0.1);">${totalReports}</td>`;
            html += `</tr>`;
        });
        
        html += '</tbody></table>';
        this.comparisonTable.innerHTML = html;
    },
    
    searchModels(query) {
        if (!this.chartData || !this.searchResults) return;
        
        const { models, datasets } = this.chartData;
        
        if (!query.trim()) {
            this.searchResults.innerHTML = '<p class="text-muted">Start typing to search for models...</p>';
            return;
        }
        
        // Filter models that match the query
        const matches = models.filter(model => 
            model.toLowerCase().includes(query.toLowerCase())
        );
        
        if (matches.length === 0) {
            this.searchResults.innerHTML = '<p class="text-muted">No models found matching your search.</p>';
            return;
        }
        
        // Display results
        let html = '<div class="row">';
        
        matches.forEach(model => {
            const modelIndex = models.indexOf(model);
            let totalAmount = 0;
            let breakdown = {};
            
            datasets.forEach(dataset => {
                const amount = dataset.data[modelIndex] || 0;
                if (amount > 0) {
                    totalAmount += amount;
                    breakdown[dataset.label] = {
                        amount: amount,
                        count: dataset.count[modelIndex] || 0,
                        color: dataset.backgroundColor
                    };
                }
            });
            
            html += `
                <div class="col-12 mb-3">
                    <div class="card" style="border-left: 4px solid #667eea;">
                        <div class="card-body">
                            <h4 class="h5 mb-3">${model}</h4>
                            <p class="h4 text-primary mb-3">Total: $${totalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                            <div class="row">
            `;
            
            Object.keys(breakdown).forEach(cvmType => {
                const cvmData = breakdown[cvmType];
                html += `
                    <div class="col-md-3 col-6 mb-2">
                        <div style="width: 20px; height: 20px; background: ${cvmData.color}; display: inline-block; border: 2px solid black; margin-right: 5px;"></div>
                        <strong>${cvmType}</strong>
                        <div class="ms-4">
                            <div>Amount: <strong>$${cvmData.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong></div>
                            <div>Reports: <strong>${cvmData.count}</strong></div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        this.searchResults.innerHTML = html;
    },
    
    // Helper function to get contrasting text color
    updateExpenseTypesTable(data) {
        if (!this.expenseTypesTable) return;
        
        if (!data.top3ExpenseTypes || Object.keys(data.top3ExpenseTypes).length === 0) {
            this.expenseTypesTable.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <strong>⚠️ No Expense Type Data Found</strong><br>
                    The CSV file does not contain an "Expense Type" column, or no TPOS entries have expense type information.
                    <br><br>
                    <strong>Expected column names:</strong> "Expense Type", "Expense type", "Type", "Category", or "Expense Category"
                </div>
            `;
            return;
        }
        
        const { models, top3ExpenseTypes } = data;
        
        let html = `
            <table class="table table-bordered table-hover" style="margin: 0;">
                <thead style="position: sticky; top: 0; z-index: 10;">
                    <tr>
                        <th style="padding: 1rem; font-weight: bold; border: 2px solid #000; background: #ffffff; color: #000000;">Model Name</th>
                        <th style="padding: 1rem; font-weight: bold; border: 2px solid #000; background: #ffffff; color: #000000;">Rank</th>
                        <th style="padding: 1rem; font-weight: bold; border: 2px solid #000; background: #ffffff; color: #000000;">Expense Type</th>
                        <th style="padding: 1rem; font-weight: bold; border: 2px solid #000; background: #ffffff; color: #000000;">Incorrect Classifications</th>
                        <th style="padding: 1rem; font-weight: bold; border: 2px solid #000; background: #ffffff; color: #000000;">TPOS Amount (USD)</th>
                        <th style="padding: 1rem; font-weight: bold; border: 2px solid #000; background: #ffffff; color: #000000;">Total TPOS Amount (USD)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        models.forEach(model => {
            const expenseTypes = top3ExpenseTypes[model] || [];
            
            // Calculate total TPOS amount for this model
            const totalTPOSAmount = expenseTypes.reduce((sum, expense) => sum + expense.amount, 0);
            
            if (expenseTypes.length === 0) {
                html += `
                    <tr>
                        <td style="padding: 0.75rem; font-weight: bold; border: 1px solid #000;">${model}</td>
                        <td colspan="5" style="padding: 0.75rem; text-align: center; color: #666; border: 1px solid #000;">No TPOS data available</td>
                    </tr>
                `;
            } else {
                expenseTypes.forEach((expense, index) => {
                    const rank = index + 1;
                    
                    html += `
                        <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                            ${index === 0 ? `<td rowspan="${expenseTypes.length}" style="padding: 0.75rem; font-weight: bold; vertical-align: middle; border: 1px solid #000; background: #f0f0f0;">${model}</td>` : ''}
                            <td style="padding: 0.75rem; text-align: center; font-size: 1.1rem; font-weight: bold; border: 1px solid #000;">${rank}</td>
                            <td style="padding: 0.75rem; border: 1px solid #000;">${expense.expenseType}</td>
                            <td style="padding: 0.75rem; text-align: center; border: 1px solid #000;">${expense.count}</td>
                            <td style="padding: 0.75rem; text-align: right; font-weight: bold; border: 1px solid #000; background: rgba(255, 215, 0, 0.1);">$${expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            ${index === 0 ? `<td rowspan="${expenseTypes.length}" style="padding: 0.75rem; text-align: right; font-weight: bold; vertical-align: middle; border: 1px solid #000; background: rgba(0, 128, 0, 0.15); font-size: 1.1rem;">$${totalTPOSAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>` : ''}
                        </tr>
                    `;
                });
            }
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        this.expenseTypesTable.innerHTML = html;
    },
    
    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black for light colors, white for dark colors
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
};

// Scroll to top immediately on page load (before DOM ready)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    app.init();
});