const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/expenses", expenseRoutes);

// Basic health check
app.get("/", (req, res) => {
  res.json({ message: "Smart Expense Tracker API is running." });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Centralized error-handling middleware.
// Any handler that calls next(err) - e.g. if expenses.json is corrupt or
// unreadable - ends up here instead of crashing the server or leaking a
// stack trace to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unexpected server error:", err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

module.exports = app;
