const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Manage personal expenses
 */

/* ------------------------------------------------------------------ */
/* Core required endpoints                                             */
/* ------------------------------------------------------------------ */

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Add a new expense
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, amount, category, date]
 *             properties:
 *               title: { type: string, example: Pizza }
 *               amount: { type: number, example: 300 }
 *               category: { type: string, example: Food }
 *               date: { type: string, example: 2026-07-31 }
 *     responses:
 *       201: { description: Expense created }
 *       400: { description: Validation error }
 */
router.post("/", expenseController.addExpense);

/**
 * @swagger
 * /expenses/total:
 *   get:
 *     summary: Get the total of all expenses, optionally filtered by category
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200: { description: Total amount }
 */
router.get("/total", expenseController.getTotal);

/* ------------------------------------------------------------------ */
/* Bonus endpoints (beyond the core spec)                              */
/* ------------------------------------------------------------------ */

/**
 * @swagger
 * /expenses/summary:
 *   get:
 *     summary: "[Bonus] Get overall totals plus a per-category breakdown"
 *     tags: [Expenses]
 *     responses:
 *       200: { description: Summary object }
 */
router.get("/summary", expenseController.getSummary);

/**
 * @swagger
 * /expenses/search:
 *   get:
 *     summary: "[Bonus] Search expenses by a partial, case-insensitive title match"
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Matching expenses }
 *       400: { description: Missing title query parameter }
 */
router.get("/search", expenseController.searchExpenses);

/**
 * @swagger
 * /expenses/top-category:
 *   get:
 *     summary: "[Bonus] Get the category with the highest total spend"
 *     tags: [Expenses]
 *     responses:
 *       200: { description: Top category and its total }
 */
router.get("/top-category", expenseController.getTopCategory);

/**
 * @swagger
 * /expenses/bulk:
 *   post:
 *     summary: "[Bonus] Add multiple expenses in one request"
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expenses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string }
 *                     amount: { type: number }
 *                     category: { type: string }
 *                     date: { type: string }
 *     responses:
 *       201: { description: Report of added and failed entries }
 *       400: { description: "'expenses' missing or not an array" }
 */
router.post("/bulk", expenseController.addBulkExpenses);

/* ------------------------------------------------------------------ */
/* Core required endpoint (list/filter) - also supports bonus query    */
/* params: from, to, sort, order, page, limit                         */
/* ------------------------------------------------------------------ */

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: >
 *       Get all expenses. Supports category filter (required), plus bonus
 *       filters: date range (from/to), sorting (sort/order), and
 *       pagination (page/limit).
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: 2026-07-01 }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: 2026-07-31 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [amount, date] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of expenses (or a paginated object when page/limit is used) }
 *       400: { description: Invalid filter/sort/pagination parameter }
 */
router.get("/", expenseController.getExpenses);

/* ------------------------------------------------------------------ */
/* Core required endpoint + bonus update, both keyed by :id            */
/* ------------------------------------------------------------------ */

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete an expense by id
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Expense deleted successfully }
 *       400: { description: Id is not a number }
 *       404: { description: Expense not found }
 *   put:
 *     summary: "[Bonus] Update an expense by id (partial update)"
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               amount: { type: number }
 *               category: { type: string }
 *               date: { type: string }
 *     responses:
 *       200: { description: Updated expense }
 *       400: { description: Validation error }
 *       404: { description: Expense not found }
 *   patch:
 *     summary: "[Bonus] Update an expense by id (partial update, same as PUT here)"
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated expense }
 *       400: { description: Validation error }
 *       404: { description: Expense not found }
 */
router.delete("/:id", expenseController.deleteExpense);
router.put("/:id", expenseController.updateExpense);
router.patch("/:id", expenseController.updateExpense);

module.exports = router;
