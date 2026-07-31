# AI Usage Notes

## AI Tools Used

Claude, ChatGPT, Gemini

## AI Generated

- Full project scaffold: `src/app.js`, `src/server.js`, folder structure
- `src/utils/fileHandler.js` — JSON file read/write helper
- `src/controllers/expenseController.js` — validation logic and all
  endpoint handlers (add, get, filter, total, delete)
- `src/routes/expenseRoutes.js` — route definitions with Swagger JSDoc annotations
- `src/swagger.js` — Swagger/OpenAPI configuration
- `tests/expense.test.js` — Jest + Supertest suite for core required
  endpoints (16 tests, including edge cases: empty-result filters, zero
  total, repeated deletes, case-insensitive filtering, non-string/non-numeric
  inputs)
- Centralized error-handling middleware in `src/app.js`
- `.github/workflows/test.yml` — CI workflow to run tests on push
- `README.md` and this file's initial structure
- **Bonus features beyond the assignment's required spec** (all in
  `expenseController.js` / `expenseRoutes.js`): update an expense
  (`PUT`/`PATCH /expenses/:id`), bulk add (`POST /expenses/bulk`), summary
  endpoint (`GET /expenses/summary`), title search (`GET /expenses/search`),
  top spending category (`GET /expenses/top-category`), date-range filtering,
  sorting, and pagination added to `GET /expenses`
- `tests/expense.bonus.test.js` — 15 additional tests covering every bonus
  feature above

## My Contributions

> - Ran `npm install` and `npm test` locally and confirmed all 31 tests pass
> - Started the server with `npm start` and manually exercised every
>   endpoint (both required and bonus) through the Swagger UI at `/api-docs`
> - Read through `expenseController.js` and understood why each
>   validation check, error-handling branch, and bonus feature works the way it does
> - Decided whether to keep, modify, or remove any of the bonus features
>   (update, bulk add, summary, search, top-category, sorting/pagination,
>   date-range filter) based on whether they add value for your use case
> - Changed / fixed: (list anything you personally modified — e.g.
>   tightened a validation rule, changed an error message wording,
>   adjusted the id-generation approach)
> - Decided to keep id generation as a simple incrementing integer
>   (max existing id + 1) rather than using `uuid`, to match the
>   `"id": 1` style shown in the assignment's example responses

## Suggestions Not Used

The suggested package list included `uuid` for generating expense ids. This
wasn't used because the assignment's example responses show plain
incrementing integer ids (`"id": 1`), so a simple counter was used instead
for consistency with the spec.

A database (e.g. MongoDB) could have been used for persistence, but wasn't
necessary since the assignment explicitly allows local JSON file storage,
which is simpler and sufficient for this scope.

## Honesty Note

This project was built with heavy AI assistance, which the assignment
explicitly permits as long as it's disclosed. Before submitting, review
every file, run the test suite yourself, exercise the API manually, and
replace the TODO section above with what you actually did and verified —
that's the whole point of this file.
