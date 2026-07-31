const path = require("path");
const fs = require("fs");

const TEST_DATA_FILE = path.join(__dirname, "test-expenses-bonus.json");
process.env.EXPENSES_DATA_FILE = TEST_DATA_FILE;

const request = require("supertest");
const app = require("../src/app");

beforeAll(() => {
  fs.writeFileSync(TEST_DATA_FILE, "[]", "utf-8");
});

afterAll(() => {
  if (fs.existsSync(TEST_DATA_FILE)) {
    fs.unlinkSync(TEST_DATA_FILE);
  }
});

// Seed a known dataset once, shared across the bonus-feature tests below.
beforeAll(async () => {
  const seed = [
    { title: "Pizza", amount: 300, category: "Food", date: "2026-07-01" },
    { title: "Groceries", amount: 1200, category: "Food", date: "2026-07-10" },
    { title: "Bus ticket", amount: 3200, category: "Travel", date: "2026-07-15" },
    { title: "Movie night", amount: 500, category: "Entertainment", date: "2026-07-20" },
  ];
  for (const expense of seed) {
    await request(app).post("/expenses").send(expense);
  }
});

describe("Bonus: Update expense (PUT/PATCH)", () => {
  test("PUT /expenses/:id updates provided fields and keeps the rest", async () => {
    const res = await request(app)
      .put("/expenses/1")
      .send({ amount: 350 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      title: "Pizza",
      amount: 350,
      category: "Food",
      date: "2026-07-01",
    });
  });

  test("PATCH /expenses/:id behaves the same as PUT", async () => {
    const res = await request(app)
      .patch("/expenses/1")
      .send({ category: "Dining" });

    expect(res.statusCode).toBe(200);
    expect(res.body.category).toBe("Dining");
  });

  test("PUT /expenses/:id returns 400 if the resulting data is invalid", async () => {
    const res = await request(app)
      .put("/expenses/1")
      .send({ amount: -10 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /expenses/:id returns 404 for a non-existent id", async () => {
    const res = await request(app).put("/expenses/999").send({ amount: 10 });

    expect(res.statusCode).toBe(404);
  });
});

describe("Bonus: Date range filtering", () => {
  test("GET /expenses?from=&to= returns only expenses in range", async () => {
    const res = await request(app).get(
      "/expenses?from=2026-07-05&to=2026-07-16"
    );

    expect(res.statusCode).toBe(200);
    const titles = res.body.map((e) => e.title);
    expect(titles).toEqual(["Groceries", "Bus ticket"]);
  });

  test("GET /expenses?from=<bad date> returns 400", async () => {
    const res = await request(app).get("/expenses?from=not-a-date");

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Bonus: Sorting", () => {
  test("GET /expenses?sort=amount&order=desc sorts descending by amount", async () => {
    const res = await request(app).get("/expenses?sort=amount&order=desc");

    expect(res.statusCode).toBe(200);
    const amounts = res.body.map((e) => e.amount);
    const sorted = [...amounts].sort((a, b) => b - a);
    expect(amounts).toEqual(sorted);
  });

  test("GET /expenses?sort=invalid returns 400", async () => {
    const res = await request(app).get("/expenses?sort=banana");

    expect(res.statusCode).toBe(400);
  });
});

describe("Bonus: Pagination", () => {
  test("GET /expenses?page=1&limit=2 returns a paginated object", async () => {
    const res = await request(app).get("/expenses?page=1&limit=2");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("expenses");
    expect(res.body.expenses.length).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.totalResults).toBe(4);
  });
});

describe("Bonus: Summary endpoint", () => {
  test("GET /expenses/summary returns totals and per-category breakdown", async () => {
    const res = await request(app).get("/expenses/summary");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalSpent");
    expect(res.body).toHaveProperty("expenseCount", 4);
    expect(res.body).toHaveProperty("averageExpense");
    expect(res.body.categories).toHaveProperty("Travel", 3200);
  });
});

describe("Bonus: Search by title", () => {
  test("GET /expenses/search?title=<partial match> is case-insensitive", async () => {
    const res = await request(app).get("/expenses/search?title=bus");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Bus ticket");
  });

  test("GET /expenses/search without a title returns 400", async () => {
    const res = await request(app).get("/expenses/search");

    expect(res.statusCode).toBe(400);
  });
});

describe("Bonus: Top category", () => {
  test("GET /expenses/top-category returns the highest-spend category", async () => {
    const res = await request(app).get("/expenses/top-category");

    expect(res.statusCode).toBe(200);
    expect(res.body.category).toBe("Travel");
    expect(res.body.total).toBe(3200);
  });
});

describe("Bonus: Bulk add", () => {
  test("POST /expenses/bulk adds valid entries and reports invalid ones", async () => {
    const res = await request(app)
      .post("/expenses/bulk")
      .send({
        expenses: [
          { title: "Coffee", amount: 150, category: "Food", date: "2026-07-25" },
          { title: "Bad one", amount: -5, category: "Food", date: "2026-07-25" },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.added.length).toBe(1);
    expect(res.body.failed.length).toBe(1);
    expect(res.body.failed[0].index).toBe(1);
  });

  test("POST /expenses/bulk returns 400 when 'expenses' is not an array", async () => {
    const res = await request(app).post("/expenses/bulk").send({ expenses: "oops" });

    expect(res.statusCode).toBe(400);
  });
});
