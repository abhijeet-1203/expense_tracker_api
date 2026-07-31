const path = require("path");
const fs = require("fs");

// Use an isolated data file for tests so we never touch the real
// expenses.json that a developer might be using locally.
const TEST_DATA_FILE = path.join(__dirname, "test-expenses.json");
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

describe("Expense Tracker API", () => {
  test("POST /expenses adds a new expense", async () => {
    const res = await request(app).post("/expenses").send({
      title: "Pizza",
      amount: 300,
      category: "Food",
      date: "2026-07-31",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: "Pizza",
      amount: 300,
      category: "Food",
      date: "2026-07-31",
    });
  });

  test("POST /expenses returns 400 when amount is invalid", async () => {
    const res = await request(app).post("/expenses").send({
      title: "Broken item",
      amount: -50,
      category: "Misc",
      date: "2026-07-31",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Amount must be greater than zero.");
  });

  test("POST /expenses returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/expenses").send({
      amount: 100,
      category: "Food",
      date: "2026-07-31",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /expenses returns 400 for an invalid date", async () => {
    const res = await request(app).post("/expenses").send({
      title: "Bad date",
      amount: 50,
      category: "Food",
      date: "31-07-2026",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("GET /expenses returns all expenses", async () => {
    // add a second expense in a different category
    await request(app).post("/expenses").send({
      title: "Bus ticket",
      amount: 3200,
      category: "Travel",
      date: "2026-07-30",
    });

    const res = await request(app).get("/expenses");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test("GET /expenses?category=Food filters by category", async () => {
    const res = await request(app).get("/expenses?category=Food");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe("Food");
  });

  test("GET /expenses/total returns the overall total", async () => {
    const res = await request(app).get("/expenses/total");

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(3500); // 300 + 3200
  });

  test("GET /expenses/total?category=Food returns the category total", async () => {
    const res = await request(app).get("/expenses/total?category=Food");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ category: "Food", total: 300 });
  });

  test("DELETE /expenses/:id deletes an expense", async () => {
    const res = await request(app).delete("/expenses/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Expense deleted successfully" });

    const getRes = await request(app).get("/expenses");
    expect(getRes.body.length).toBe(1);
  });

  test("DELETE /expenses/:id returns 404 for a non-existent id", async () => {
    const res = await request(app).delete("/expenses/999");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  test("DELETE /expenses/:id on an already-deleted id returns 404 again", async () => {
    const first = await request(app).delete("/expenses/2");
    expect(first.statusCode).toBe(200);

    const second = await request(app).delete("/expenses/2");
    expect(second.statusCode).toBe(404);
  });

  test("GET /expenses?category=<no match> returns an empty array, not an error", async () => {
    const res = await request(app).get("/expenses?category=Nonexistent");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("GET /expenses/total returns 0 when there are no expenses", async () => {
    const res = await request(app).get("/expenses/total");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ total: 0 });
  });

  test("GET /expenses?category= is case-insensitive", async () => {
    await request(app).post("/expenses").send({
      title: "Coffee",
      amount: 150,
      category: "Food",
      date: "2026-07-29",
    });

    const res = await request(app).get("/expenses?category=food");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe("Food");
  });

  test("POST /expenses returns 400 when title is not a string", async () => {
    const res = await request(app).post("/expenses").send({
      title: 12345,
      amount: 100,
      category: "Food",
      date: "2026-07-31",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Title must be a string.");
  });

  test("DELETE /expenses/:id returns 400 for a non-numeric id", async () => {
    const res = await request(app).delete("/expenses/abc");

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
