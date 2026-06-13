import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateSQL = async (apiKey, question, tableSchema) => {
  if (!apiKey) throw new Error("Missing Gemini API Key. Please provide one.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert Data Analyst and SQL Developer.
    Your task is to convert the user's natural language question into a valid SQLite SQL query.
    
    Here is the schema of the database table available:
    ${tableSchema}
    
    User Question: "${question}"
    
    Respond ONLY with a raw JSON object containing the SQL query. Do NOT wrap it in markdown. Do not add explanations.
    Format:
    {
      "query": "SELECT * FROM data_table LIMIT 10;"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/```json/gi, '').replace(/```/g, '');
    return JSON.parse(responseText).query;
  } catch (err) {
    throw new Error("Failed to generate SQL from Gemini. Check your API Key.");
  }
};

export const determineChartType = async (apiKey, query, columns, data) => {
  if (!apiKey || data.length === 0) return { chartType: "none" };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Analyze this SQL result and recommend the best Chart.js chart type to visualize it.
    Query: ${query}
    Columns: ${JSON.stringify(columns)}
    Sample Data (first 3 rows): ${JSON.stringify(data.slice(0, 3))}
    
    If the data cannot be charted (e.g. just a single row with a single text value, or a raw list of strings without numbers), return "none".
    Valid chart types: "bar", "pie", "line", "doughnut", "none".
    
    Respond ONLY with a raw JSON object. Do NOT wrap in markdown.
    Format:
    {
      "chartType": "bar",
      "xAxisColumn": "column_name",
      "yAxisColumn": "column_name"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/```json/gi, '').replace(/```/g, '');
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to determine chart type", err);
    return { chartType: "none" };
  }
};
