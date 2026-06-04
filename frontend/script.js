document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('query-input');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    
    const resultsSection = document.getElementById('results-section');
    const errorBox = document.getElementById('error-box');
    const successBox = document.getElementById('success-box');
    const sqlOutput = document.getElementById('sql-output');
    
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    const rowCount = document.getElementById('row-count');
    
    const exportBtn = document.getElementById('export-btn');
    const historyList = document.getElementById('history-list');
    const chartContainer = document.getElementById('chart-container');
    const dataAndChartWrap = document.querySelector('.data-and-chart');

    let currentData = [];
    let currentColumns = [];
    let queryHistory = [];
    let chartInstance = null;

    // --- Suggestion Chips ---
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            inputField.value = chip.textContent;
            inputField.focus();
        });
    });

    // --- File Upload Logic ---
    const fileUpload = document.getElementById('file-upload');
    const uploadLabel = document.querySelector('.upload-btn');

    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadLabel.classList.add('uploading');
        uploadLabel.innerHTML = '⏳ Uploading...';
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Failed to upload file");

            successBox.innerHTML = `✅ ${data.message} <br> Ready to query ${data.rows} rows!`;
            successBox.classList.remove('hidden');
            inputField.value = `Show me the first 10 rows from ${data.table_name}`;
        } catch (error) {
            errorBox.textContent = `Error: ${error.message}`;
            errorBox.classList.remove('hidden');
        } finally {
            uploadLabel.classList.remove('uploading');
            uploadLabel.innerHTML = '<span class="upload-icon">📁</span> Upload Dataset';
            fileUpload.value = '';
        }
    });

    // --- Query Submission ---
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitQuery();
    });
    submitBtn.addEventListener('click', submitQuery);

    async function submitQuery() {
        const query = inputField.value.trim();
        if (!query) return;

        // UI Loading State
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');
        exportBtn.classList.add('hidden');

        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Failed to generate query");

            // Cache data for Export feature
            currentData = data.data;
            currentColumns = data.columns;

            // Update UI
            sqlOutput.textContent = data.sql;
            hljs.highlightElement(sqlOutput);
            renderTable(currentColumns, currentData);
            
            // Try generating a chart
            renderChart(currentColumns, currentData);
            
            // Add to History Sidebar
            addToHistory(query);
            
            resultsSection.classList.remove('hidden');
            if (currentData.length > 0) exportBtn.classList.remove('hidden');

        } catch (error) {
            errorBox.textContent = `Error: ${error.message}`;
            errorBox.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }

    // --- Data Rendering ---
    function renderTable(columns, dataRows) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        rowCount.textContent = `${dataRows.length} row${dataRows.length !== 1 ? 's' : ''}`;

        if (!columns || columns.length === 0) {
            tableHead.innerHTML = '<tr><th>Result</th></tr>';
            tableBody.innerHTML = '<tr><td>No data returned or query was not a SELECT statement.</td></tr>';
            return;
        }

        const trHead = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        tableHead.appendChild(trHead);

        if (dataRows.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;font-style:italic;color:var(--text-muted)">0 results found.</td></tr>`;
            return;
        }

        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] !== null ? row[col] : 'NULL';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    // --- Chart Generation Logic ---
    function renderChart(columns, dataRows) {
        if (chartInstance) { chartInstance.destroy(); }
        
        // Hide chart by default
        chartContainer.classList.add('hidden');
        dataAndChartWrap.classList.remove('has-chart');

        if (!columns || columns.length < 2 || dataRows.length === 0 || dataRows.length > 50) return;

        // Auto-detect a label column (string) and a data column (number)
        let labelCol = null;
        let dataCol = null;

        for (const col of columns) {
            const sample = dataRows[0][col];
            if (typeof sample === 'number' && !dataCol) {
                dataCol = col;
            } else if ((typeof sample === 'string' || isNaN(sample)) && !labelCol) {
                labelCol = col;
            }
        }

        // If we didn't find a perfect string/number split, try to just use first two cols if they make sense
        if (!labelCol || !dataCol) {
            labelCol = columns[0];
            dataCol = columns[1];
        }

        // Validate data col contains numbers (or things that can parse to numbers)
        const isNumeric = dataRows.every(row => !isNaN(parseFloat(row[dataCol])));
        if (!isNumeric) return;

        const labels = dataRows.map(row => row[labelCol]);
        const values = dataRows.map(row => parseFloat(row[dataCol]));

        // Determine chart type (Pie for small datasets, Bar for larger)
        const chartType = labels.length <= 5 ? 'doughnut' : 'bar';

        // Setup colors based on theme
        const bgColors = [
            'rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(6, 182, 212, 0.8)',
            'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'
        ];

        // Reveal chart container
        chartContainer.classList.remove('hidden');
        dataAndChartWrap.classList.add('has-chart');

        const ctx = document.getElementById('results-chart').getContext('2d');
        
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        chartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: dataCol,
                    data: values,
                    backgroundColor: chartType === 'doughnut' ? bgColors : 'rgba(139, 92, 246, 0.6)',
                    borderColor: chartType === 'doughnut' ? 'transparent' : 'rgba(139, 92, 246, 1)',
                    borderWidth: 1,
                    borderRadius: chartType === 'bar' ? 4 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: chartType === 'doughnut', position: 'right' }
                },
                scales: chartType === 'bar' ? {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                } : {}
            }
        });
    }

    // --- Export CSV Logic ---
    exportBtn.addEventListener('click', () => {
        if (!currentData || currentData.length === 0) return;
        
        const csvRows = [];
        // Add Header
        csvRows.push(currentColumns.join(','));
        
        // Add Data
        for (const row of currentData) {
            const values = currentColumns.map(col => {
                let val = row[col] !== null ? row[col].toString() : '';
                // Escape quotes and wrap in quotes if contains comma
                if (val.includes(',') || val.includes('"')) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'sql_results_export.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // --- Query History Logic ---
    function addToHistory(query) {
        // Prevent immediate duplicates
        if (queryHistory[0] === query) return;
        
        queryHistory.unshift(query);
        if (queryHistory.length > 20) queryHistory.pop(); // Keep max 20

        // Render History
        if (queryHistory.length === 1) historyList.innerHTML = ''; // clear empty state

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `<span class="query-text">${query}</span>`;
        
        card.addEventListener('click', () => {
            inputField.value = query;
            inputField.focus();
        });

        historyList.prepend(card);
    }
});
