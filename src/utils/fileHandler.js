const fs = require("fs");
const path = require("path");

// Allow the data file path to be overridden (used by tests so they don't
// touch the real expenses.json that a running server might be using).
const DATA_FILE =
  process.env.EXPENSES_DATA_FILE ||
  path.join(__dirname, "..", "..", "expenses.json");

/**
 * Reads all expenses from the JSON data file.
 * Returns an empty array if the file doesn't exist or is empty/corrupt.
 */
function readExpenses() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8").trim();
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read expenses data file:", err.message);
    return [];
  }
}

/**
 * Overwrites the JSON data file with the given array of expenses.
 */
function writeExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2), "utf-8");
}

module.exports = { readExpenses, writeExpenses, DATA_FILE };
