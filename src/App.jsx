import React, { useState, useEffect } from 'react';
import { Database, Upload, Wand2, Play, Table as TableIcon, BarChart3, Key, Download } from 'lucide-react';
import { initDB, loadCSVtoDB, executeQuery } from './utils/database';
import { generateSQL, determineChartType } from './utils/gemini';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function App() {
  const [db, setDb] = useState(null);
  const [schema, setSchema] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [question, setQuestion] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    initDB().then(database => setDb(database));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !db) return;
    
    try {
      setIsProcessing(true);
      const result = await loadCSVtoDB(db, file, 'data_table');
      setSchema(result.schema);
      setDbStats({ name: file.name, rows: result.rowCount, cols: result.headers.length });
    } catch (err) {
      alert("Failed to load CSV: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };

  const executeAIQuery = async () => {
    if (!question) return alert("Please ask a question.");
    if (!schema) return alert("Please upload a CSV dataset first.");
    if (!apiKey) return alert("Please configure your Gemini API Key.");

    setIsProcessing(true);
    setSqlQuery('');
    setQueryResult(null);
    setChartConfig(null);

    try {
      // 1. Generate SQL
      const generatedSql = await generateSQL(apiKey, question, schema);
      setSqlQuery(generatedSql);

      // 2. Execute SQL
      const result = executeQuery(db, generatedSql);
      setQueryResult(result);

      // 3. Determine Chart
      if (result.values.length > 0) {
         const chartRec = await determineChartType(apiKey, generatedSql, result.columns, result.values);
         if (chartRec && chartRec.chartType !== 'none') {
           setChartConfig({
             type: chartRec.chartType,
             xCol: chartRec.xAxisColumn,
             yCol: chartRec.yAxisColumn
           });
         }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCSV = () => {
    if (!queryResult || queryResult.values.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + queryResult.columns.join(",") + "\n"
      + queryResult.values.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sql_results.csv");
    document.body.appendChild(link);
    link.click();
  };

  const renderChart = () => {
    if (!chartConfig || !queryResult) return null;
    
    const xIndex = queryResult.columns.indexOf(chartConfig.xCol);
    const yIndex = queryResult.columns.indexOf(chartConfig.yCol);
    
    if (xIndex === -1 || yIndex === -1) return null;

    const labels = queryResult.values.map(row => row[xIndex]);
    const dataPoints = queryResult.values.map(row => parseFloat(row[yIndex]));

    const data = {
      labels,
      datasets: [
        {
          label: chartConfig.yCol,
          data: dataPoints,
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(236, 72, 153, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
          ],
          borderWidth: 1,
        },
      ],
    };

    const options = { responsive: true, maintainAspectRatio: false, color: '#94a3b8' };

    switch (chartConfig.type) {
      case 'pie': return <Pie data={data} options={options} />;
      case 'doughnut': return <Doughnut data={data} options={options} />;
      case 'line': return <Line data={data} options={options} />;
      case 'bar':
      default:
        return <Bar data={data} options={options} />;
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-center glass-panel p-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Database size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI SQL Assistant
            </h1>
            <p className="text-slate-400 text-sm font-medium">Serverless WebAssembly Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="password" 
              placeholder="Gemini API Key..." 
              value={apiKey}
              onChange={handleApiKeyChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <label className={`transition px-6 py-2.5 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-bold shadow-lg shadow-purple-500/20 ${dbStats ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'}`}>
            <Upload size={18} />
            {dbStats ? 'Replace Dataset' : 'Upload CSV Data'}
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Ask Data */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-200">
              <Wand2 size={20} className="text-purple-400" />
              Ask the Data
            </h2>
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 h-32 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium"
              placeholder="E.g. What is the total revenue by product category?"
            ></textarea>
            <button 
              onClick={executeAIQuery}
              disabled={isProcessing || !dbStats}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition shadow-lg shadow-blue-500/20"
            >
              {isProcessing ? <span className="animate-pulse">Forging Query...</span> : <><Play size={18} fill="currentColor" /> Execute AI Query</>}
            </button>
          </div>

          {dbStats && (
            <div className="glass-panel p-6">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Active Database</h3>
               <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400">File Name</span>
                    <span className="text-slate-200 font-medium">{dbStats.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400">Total Rows</span>
                    <span className="text-blue-400 font-bold">{dbStats.rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Columns</span>
                    <span className="text-purple-400 font-bold">{dbStats.cols}</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Results & Charts */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!dbStats ? (
            <div className="glass-panel p-6 flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
               <Database size={80} className="mb-6 opacity-30 text-slate-400" />
               <h2 className="text-2xl font-bold text-slate-300 mb-2">No Active Database</h2>
               <p className="text-lg">Upload a CSV file to initialize the WebAssembly SQLite Engine</p>
            </div>
          ) : !queryResult ? (
            <div className="glass-panel p-6 flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
               <Wand2 size={80} className="mb-6 opacity-30 text-purple-400" />
               <h2 className="text-2xl font-bold text-slate-300 mb-2">Ready to Query</h2>
               <p className="text-lg">Ask a question in plain English to unleash the AI</p>
            </div>
          ) : (
            <>
              {/* Generated SQL */}
              <div className="glass-panel p-6">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Generated SQL</h3>
                 <pre className="bg-slate-900/80 p-4 rounded-lg overflow-x-auto text-green-400 font-mono text-sm border border-slate-700/50">
                   {sqlQuery}
                 </pre>
              </div>

              {/* Data Table & Chart */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                 {/* Table */}
                 <div className="glass-panel p-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <TableIcon size={16} className="text-blue-400" /> Data Results
                      </h3>
                      <button onClick={downloadCSV} className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition">
                        <Download size={14} /> Export CSV
                      </button>
                    </div>
                    <div className="overflow-auto flex-1 p-0">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0">
                          <tr>
                            {queryResult.columns.map((col, i) => (
                              <th key={i} className="px-4 py-3 font-semibold tracking-wider whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.values.map((row, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                              {row.map((cell, j) => (
                                <td key={j} className="px-4 py-2.5 whitespace-nowrap">{cell !== null ? String(cell) : 'NULL'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {queryResult.values.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No results found for this query.</div>
                      )}
                    </div>
                 </div>

                 {/* Chart */}
                 <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <BarChart3 size={16} className="text-pink-400" /> AI Visualization
                    </h3>
                    <div className="flex-1 flex items-center justify-center relative w-full h-[300px]">
                      {chartConfig && chartConfig.type !== 'none' ? (
                        renderChart()
                      ) : (
                        <div className="text-center opacity-50 flex flex-col items-center">
                          <BarChart3 size={48} className="mb-4" />
                          <p>No suitable visualization for this dataset.</p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
