# 🔮 AI SQL Assistant

A powerful, full-stack Data Analytics platform that converts natural language into SQL, executes it against an uploaded dataset, and visualizes the results. Powered by **FastAPI**, **LangChain**, and **Google Gemini 2.5 Flash**.

## ✨ Features
* **Chat to SQL**: Type plain English, get instant SQL queries and raw data back.
* **Dynamic Dataset Upload**: Drag and drop your own `.csv` or `.xlsx` files. The backend uses Pandas to dynamically inject your data into an SQLite database for immediate querying!
* **Auto-Charting**: Intelligently analyzes SQL results and auto-generates beautiful Bar and Donut charts using `Chart.js`.
* **CSV Export**: Lightning-fast, client-side button to export your SQL query results straight to a `.csv` file.
* **Query History**: Sleek CSS Grid sidebar that remembers your successful queries during the session.
* **Glassmorphism UI**: A highly polished, modern dark-mode dashboard with floating background orbs and syntax highlighting.

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd ai-sql-assistant
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```
   GOOGLE_API_KEY="your-api-key-here"
   ```

4. **Initialize Dummy Database (Optional):**
   If you don't have a CSV to upload yet, run this to generate a mock E-Commerce dataset:
   ```bash
   python database/setup.py
   ```

5. **Start the Server:**
   ```bash
   uvicorn main:app --reload
   ```
   Then navigate to `http://localhost:8000` in your browser.

## 🛠️ Tech Stack
* **Backend**: FastAPI, Python, SQLite, Pandas
* **AI Engine**: LangChain, Google Gemini 2.5 Flash
* **Frontend**: Vanilla HTML/CSS/JS, Chart.js, Highlight.js
