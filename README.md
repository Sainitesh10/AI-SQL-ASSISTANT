# 🔮 AI SQL Assistant

A powerful, Serverless Data Analytics platform that converts natural language into SQL, executes it against an uploaded dataset entirely in your browser using WebAssembly, and visualizes the results. Powered by **WebAssembly SQLite (sql.js)**, **React**, and **Google Gemini 2.5 Flash**.

## ✨ Features
* **100% Serverless**: No backend required! Upload your CSV and an SQLite Database is instantiated directly in your browser's memory using WebAssembly.
* **Chat to SQL**: Type plain English, and Google's Gemini 2.5 Flash will instantly generate valid SQL queries.
* **Dynamic Dataset Upload**: Drag and drop your own `.csv` files. The app parses them and automatically creates the schema on the fly.
* **Auto-Charting**: Intelligently analyzes SQL results using AI and auto-generates beautiful Bar, Pie, Line, and Doughnut charts using `Chart.js`.
* **CSV Export**: Lightning-fast, client-side button to export your SQL query results straight to a `.csv` file.
* **Glassmorphism UI**: A highly polished, modern dark-mode dashboard with custom gradients and Tailwind CSS styling.

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sainitesh10/AI-SQL-ASSISTANT.git
   cd ai-sql-assistant
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Then navigate to `http://localhost:5174` (or the port specified by Vite) in your browser.

4. **Configure Gemini API Key:**
   When you open the app, enter your Google Gemini API Key in the top right corner. The key is stored securely in your browser's local storage.

## 🛠️ Tech Stack
* **Engine**: `sql.js` (SQLite compiled to WebAssembly)
* **AI Engine**: `@google/generative-ai` (Gemini 2.5 Flash)
* **Frontend**: React, Vite, Tailwind CSS, Chart.js, Lucide Icons
* **Data Parsing**: PapaParse
