# Expense Tracker API

A REST API for managing personal expenses — add, view, filter by category,
calculate totals, and delete entries. Data is persisted to a local JSON file,
so no database setup is required.

![Tests](https://github.com/abhijeet-1203/expense_tracker_api/actions/workflows/test.yml/badge.svg)

## Installation

```
npm install
```

## Start Server

```
npm start
```

Server runs at `http://localhost:3000`.

## Run Development

```
npm run dev
```

Runs the server with `nodemon`, restarting automatically on file changes.

## Run Tests

```
npm test
```

Runs the full Jest + Supertest suite (31 tests) covering all endpoints,
validation rules, and edge cases.

## API Endpoints — Required (per assignment spec)

```
POST   /expenses
GET    /expenses
GET    /expenses?category=Food
GET    /expenses/total
GET    /expenses/total?category=Food
DELETE /expenses/:id
```

## API Endpoints — Bonus (beyond the assignment spec)

These are extra features layered on top of the required API. They don't
replace anything above — everything in the required section still works
exactly as specified.

```
PUT    /expenses/:id                Update an expense (partial update)
PATCH  /expenses/:id                Same as PUT, for clients that prefer PATCH
POST   /expenses/bulk               Add multiple expenses in one request
GET    /expenses/summary            Overall totals + per-category breakdown
GET    /expenses/search?title=      Partial, case-insensitive title search
GET    /expenses/top-category       Category with the highest total spend
GET    /expenses?from=&to=          Filter by date range (combinable with category)
GET    /expenses?sort=&order=       Sort by "amount" or "date", "asc"/"desc"
GET    /expenses?page=&limit=       Paginate results (returns a wrapped object)
```

### Bonus endpoint examples (curl)

**Update an expense (partial)**
```
curl -X PATCH http://localhost:3000/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{"amount":333}'
```

**Bulk add**
```
curl -X POST http://localhost:3000/expenses/bulk \
  -H "Content-Type: application/json" \
  -d '{"expenses":[{"title":"Tea","amount":50,"category":"Food","date":"2026-07-20"}]}'
```

**Summary**
```
curl http://localhost:3000/expenses/summary
```

**Search by title**
```
curl "http://localhost:3000/expenses/search?title=bus"
```

**Top spending category**
```
curl http://localhost:3000/expenses/top-category
```

**Date range + sort + pagination**
```
curl "http://localhost:3000/expenses?from=2026-07-01&to=2026-07-31&sort=amount&order=desc&page=1&limit=5"
```
Note: when `page`/`limit` is used, the response shape changes from a plain
array to `{ page, limit, totalResults, totalPages, expenses }`.

### Example requests (curl) — required endpoints

**Add an expense**
```
curl -X POST http://localhost:3000/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Pizza","amount":300,"category":"Food","date":"2026-07-31"}'
```

**Get all expenses**
```
curl http://localhost:3000/expenses
```

**Filter by category**
```
curl "http://localhost:3000/expenses?category=Food"
```

**Overall total**
```
curl http://localhost:3000/expenses/total
```

**Total for one category**
```
curl "http://localhost:3000/expenses/total?category=Food"
```

**Delete an expense**
```
curl -X DELETE http://localhost:3000/expenses/1
```

## Validation

Requests to `POST /expenses` return `400 Bad Request` with an
`{ "error": "..." }` body when:

- `title` is missing, empty, or not a string
- `amount` is missing or not a number
- `amount` is less than or equal to `0`
- `category` is missing, empty, or not a string
- `date` is missing or not a valid `YYYY-MM-DD` calendar date (e.g.
  `2026-02-30` is rejected even though it matches the format)

`DELETE /expenses/:id` returns `400` if the id isn't numeric, and `404` if no
expense with that id exists.

## Error Handling

- Each controller function wraps its logic in `try/catch` and forwards
  unexpected errors to Express's `next(err)`.
- A centralized error-handling middleware in `src/app.js` catches anything
  that reaches it (e.g. a corrupted or unreadable `expenses.json`) and
  responds with a consistent `500 { "error": "..." }` shape instead of
  crashing the server or leaking a stack trace.
- Unmatched routes return a `404 { "error": "Route not found." }`.

## Design Decisions

- **Integer ids instead of UUIDs**: ids auto-increment (`max existing id + 1`)
  to match the plain integer style (`"id": 1`) shown in the spec's example
  responses, rather than pulling in the `uuid` package.
- **JSON file storage**: `expenses.json` is read/written on every request via
  `src/utils/fileHandler.js`. This keeps the project dependency-free for
  persistence and matches the assignment's "JSON file or in-memory array"
  requirement. The data file path is overridable via the
  `EXPENSES_DATA_FILE` environment variable, which lets the test suite run
  against an isolated file instead of the real data.
- **Case-insensitive category filtering**: `?category=food` and
  `?category=Food` return the same results, since users shouldn't need to
  remember exact casing.
- **Centralized error middleware**: keeps error-response formatting in one
  place instead of repeating `try/catch` boilerplate per route.
- **PUT and PATCH behave identically**: both do a partial merge (only the
  fields you send are changed) rather than PUT requiring the full object.
  This is a deliberate simplification over strict REST semantics, done for
  developer convenience — noted here so it's not mistaken for an oversight.
- **Pagination changes the response shape**: `GET /expenses` returns a plain
  array normally, but when `page`/`limit` is used it returns
  `{ page, limit, totalResults, totalPages, expenses }` instead. This only
  happens when those params are explicitly passed, so the required/default
  behavior is unaffected.
- **Bulk add is partial-success by design**: `POST /expenses/bulk` saves
  whichever entries are valid and reports the rest as `failed` with their
  index and reason, rather than rejecting the whole batch if one entry is bad.

## Swagger / OpenAPI Documentation

Interactive API docs are served once the server is running:

```
http://localhost:3000/api-docs
```

Generated from JSDoc comments in `src/routes/expenseRoutes.js` via
`swagger-jsdoc` and served with `swagger-ui-express`.

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/test.yml`) runs `npm install`
and `npm test` automatically on every push and pull request to `main`,
against Node.js 18.x and 20.x.

## Project Structure

```
expense-tracker-api/
├── README.md
├── images/
├── AI_NOTES.md
├── package.json
├── expenses.json
├── .gitignore
├── .github/workflows/test.yml
├── src/
│   ├── app.js
│   ├── server.js
│   ├── swagger.js
│   ├── routes/
│   │   └── expenseRoutes.js
│   ├── controllers/
│   │   └── expenseController.js
│   └── utils/
│       └── fileHandler.js
└── tests/
    ├── expense.test.js
    └── expense.bonus.test.js
```

See `AI_NOTES.md` for a breakdown of what was AI-assisted vs. manually
reviewed and verified.
