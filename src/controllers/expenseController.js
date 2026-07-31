const { readExpenses, writeExpenses } = require("../utils/fileHandler");

/**
 * Validates a date string in strict YYYY-MM-DD format and confirms it
 * represents a real calendar date (e.g. rejects 2026-02-30).
 */
function isValidDate(dateStr) {
  if (typeof dateStr !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validates the incoming expense payload.
 * Returns an error message string, or null if the payload is valid.
 */
function validateExpense(body) {
  const { title, amount, category, date } = body;

  if (title === undefined || title === null || String(title).trim() === "") {
    return "Title is required.";
  }
  if (typeof title !== "string") {
    return "Title must be a string.";
  }
  if (amount === undefined || amount === null || amount === "") {
    return "Amount is required.";
  }
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "Amount must be a number.";
  }
  if (amount <= 0) {
    return "Amount must be greater than zero.";
  }
  if (
    category === undefined ||
    category === null ||
    String(category).trim() === ""
  ) {
    return "Category is required.";
  }
  if (typeof category !== "string") {
    return "Category must be a string.";
  }
  if (!date || !isValidDate(date)) {
    return "A valid date in YYYY-MM-DD format is required.";
  }

  return null;
}

/**
 * POST /expenses
 */
function addExpense(req, res, next) {
  try {
    const error = validateExpense(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const expenses = readExpenses();
    const nextId =
      expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;

    const newExpense = {
      id: nextId,
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
    };

    expenses.push(newExpense);
    writeExpenses(expenses);

    return res.status(201).json(newExpense);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /expenses
 * Supports: ?category=Food&from=2026-07-01&to=2026-07-31
 *           &sort=amount|date&order=asc|desc&page=1&limit=10
 */
function getExpenses(req, res, next) {
  try {
    const { category, from, to, sort, order, page, limit } = req.query;
    let expenses = readExpenses();

    if (category) {
      expenses = expenses.filter(
        (e) => e.category.toLowerCase() === String(category).toLowerCase()
      );
    }

    if (from || to) {
      if (from && !isValidDate(from)) {
        return res
          .status(400)
          .json({ error: "'from' must be a valid YYYY-MM-DD date." });
      }
      if (to && !isValidDate(to)) {
        return res
          .status(400)
          .json({ error: "'to' must be a valid YYYY-MM-DD date." });
      }
      if (from && to && from > to) {
        return res
          .status(400)
          .json({ error: "'from' date must not be after 'to' date." });
      }
      expenses = expenses.filter((e) => {
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        return true;
      });
    }

    if (sort) {
      if (sort !== "amount" && sort !== "date") {
        return res
          .status(400)
          .json({ error: "'sort' must be either 'amount' or 'date'." });
      }
      const direction = order === "desc" ? -1 : 1;
      if (order && order !== "asc" && order !== "desc") {
        return res
          .status(400)
          .json({ error: "'order' must be either 'asc' or 'desc'." });
      }
      expenses = [...expenses].sort((a, b) => {
        if (a[sort] < b[sort]) return -1 * direction;
        if (a[sort] > b[sort]) return 1 * direction;
        return 0;
      });
    }

    if (page || limit) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      if (!Number.isInteger(pageNum) || pageNum < 1) {
        return res
          .status(400)
          .json({ error: "'page' must be a positive integer." });
      }
      if (!Number.isInteger(limitNum) || limitNum < 1) {
        return res
          .status(400)
          .json({ error: "'limit' must be a positive integer." });
      }

      const start = (pageNum - 1) * limitNum;
      const paginated = expenses.slice(start, start + limitNum);

      return res.status(200).json({
        page: pageNum,
        limit: limitNum,
        totalResults: expenses.length,
        totalPages: Math.ceil(expenses.length / limitNum),
        expenses: paginated,
      });
    }

    return res.status(200).json(expenses);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /expenses/total
 * GET /expenses/total?category=Food
 */
function getTotal(req, res, next) {
  try {
    const { category } = req.query;
    const expenses = readExpenses();

    if (category) {
      const filtered = expenses.filter(
        (e) => e.category.toLowerCase() === String(category).toLowerCase()
      );
      const total = filtered.reduce((sum, e) => sum + e.amount, 0);
      return res.status(200).json({ category, total });
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return res.status(200).json({ total });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /expenses/:id
 */
function deleteExpense(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Expense id must be a number." });
    }

    const expenses = readExpenses();
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Expense not found." });
    }

    expenses.splice(index, 1);
    writeExpenses(expenses);

    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT/PATCH /expenses/:id
 * Partial update: only the fields provided in the body are changed.
 * The merged result is validated the same way as creating a new expense.
 */
function updateExpense(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Expense id must be a number." });
    }

    const expenses = readExpenses();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Expense not found." });
    }

    const existing = expenses[index];
    const merged = {
      title: req.body.title !== undefined ? req.body.title : existing.title,
      amount:
        req.body.amount !== undefined ? req.body.amount : existing.amount,
      category:
        req.body.category !== undefined
          ? req.body.category
          : existing.category,
      date: req.body.date !== undefined ? req.body.date : existing.date,
    };

    const error = validateExpense(merged);
    if (error) {
      return res.status(400).json({ error });
    }

    const updated = { id, ...merged };
    expenses[index] = updated;
    writeExpenses(expenses);

    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /expenses/bulk
 * Body: { "expenses": [ { title, amount, category, date }, ... ] }
 * Validates each entry independently; valid ones are saved, invalid ones
 * are reported back with their index and reason.
 */
function addBulkExpenses(req, res, next) {
  try {
    const { expenses: incoming } = req.body;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res
        .status(400)
        .json({ error: "'expenses' must be a non-empty array." });
    }

    const expenses = readExpenses();
    let nextId =
      expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;

    const added = [];
    const failed = [];

    incoming.forEach((item, i) => {
      const error = validateExpense(item || {});
      if (error) {
        failed.push({ index: i, error });
        return;
      }
      const newExpense = {
        id: nextId,
        title: item.title,
        amount: item.amount,
        category: item.category,
        date: item.date,
      };
      nextId += 1;
      expenses.push(newExpense);
      added.push(newExpense);
    });

    if (added.length > 0) {
      writeExpenses(expenses);
    }

    return res.status(201).json({ added, failed });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /expenses/summary
 * Returns overall totals plus a per-category breakdown.
 */
function getSummary(req, res, next) {
  try {
    const expenses = readExpenses();

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense =
      expenseCount > 0
        ? Math.round((totalSpent / expenseCount) * 100) / 100
        : 0;

    const categories = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    return res.status(200).json({
      totalSpent,
      expenseCount,
      averageExpense,
      categories,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /expenses/search?title=coffee
 * Partial, case-insensitive match on title.
 */
function searchExpenses(req, res, next) {
  try {
    const { title } = req.query;

    if (!title || String(title).trim() === "") {
      return res
        .status(400)
        .json({ error: "'title' query parameter is required." });
    }

    const expenses = readExpenses();
    const needle = String(title).toLowerCase();
    const matches = expenses.filter((e) =>
      e.title.toLowerCase().includes(needle)
    );

    return res.status(200).json(matches);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /expenses/top-category
 * Returns the category with the highest total spend.
 */
function getTopCategory(req, res, next) {
  try {
    const expenses = readExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({ message: "No expenses recorded yet." });
    }

    const totalsByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const [topCategory, topTotal] = Object.entries(totalsByCategory).reduce(
      (best, current) => (current[1] > best[1] ? current : best)
    );

    return res.status(200).json({ category: topCategory, total: topTotal });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  addExpense,
  getExpenses,
  getTotal,
  deleteExpense,
  updateExpense,
  addBulkExpenses,
  getSummary,
  searchExpenses,
  getTopCategory,
  validateExpense,
  isValidDate,
};
