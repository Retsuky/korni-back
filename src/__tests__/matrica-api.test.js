/**
 * API-тесты по матрице: публичные заявки, каталог, админ JWT, отсутствие оплаты.
 * БД мокается — не требует PostgreSQL.
 */
jest.mock("../db/db", () => ({
  query: jest.fn(),
}));

const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createApp = require("../createApp");
const { query } = require("../db/db");

describe("KORNI API (матрица требований)", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /test", async () => {
    const res = await request(app).get("/test").expect(200);
    expect(res.body).toBe(200);
  });

  it("GET /api/v1/test", async () => {
    const res = await request(app).get("/api/v1/test").expect(200);
    expect(res.body).toBe(200);
  });

  it("[1.4] POST /api/v1/contacts/create сохраняет заявку (мок БД)", async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Иван", phone: "+7", email: "a@b.c", text: "x" }],
    });

    const res = await request(app)
      .post("/api/v1/contacts/create")
      .send({
        data: {
          name: "Иван",
          phone: "+7 (999) 000-00-00",
          email: "a@b.c",
          text: "комментарий",
        },
      })
      .expect(200);

    expect(res.body).toEqual({ msg: "Application create" });
    expect(query).toHaveBeenCalled();
  });

  it("[1.2] GET /api/v1/projects возвращает список", async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Проект", cost: 1, square: 100, style: "barnhouse" }],
    });

    const res = await request(app).get("/api/v1/projects").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(1);
  });

  it("[2.1] GET /api/v1/admin/applications без токена — 401", async () => {
    await request(app).get("/api/v1/admin/applications").expect(401);
  });

  it("[2.1] GET /api/v1/admin/applications с JWT — список заявок", async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          { id: 1, login: "adm", password: await bcrypt.hash("secret", 4) },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, name: "Заявка", phone: "+7", email: null, text: null }],
      });

    const loginRes = await request(app)
      .post("/api/v1/admin/auth")
      .send({ login: "adm", password: "secret" })
      .expect(200);

    const token = loginRes.body.token_admin;
    expect(typeof token).toBe("string");

    const listRes = await request(app)
      .get("/api/v1/admin/applications")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body[0].id).toBe(10);
  });

  it("[3.1] платежи: статус API и заглушка без ключей YooKassa", async () => {
    const st = await request(app).get("/api/v1/payments/status").expect(200);
    expect(st.body).toHaveProperty("enabled");

    await request(app)
      .post("/api/v1/payments/create-deposit")
      .send({ amount: 100 })
      .expect(503);
  });

  it("[4.3] пароль администратора сверяется через bcrypt", async () => {
    const hash = await bcrypt.hash("good-password", 8);
    query.mockResolvedValueOnce({
      rows: [{ id: 1, login: "u1", password: hash }],
    });

    const ok = await request(app)
      .post("/api/v1/admin/auth")
      .send({ login: "u1", password: "good-password" })
      .expect(200);

    expect(ok.body.token_admin).toBeDefined();

    jwt.verify(ok.body.token_admin, process.env.JWT_SECRET_ADMIN);

    query.mockResolvedValueOnce({
      rows: [{ id: 1, login: "u1", password: hash }],
    });

    await request(app)
      .post("/api/v1/admin/auth")
      .send({ login: "u1", password: "wrong" })
      .expect(400);
  });
});
