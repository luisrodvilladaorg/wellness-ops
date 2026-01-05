const request = require("supertest");

describe("Health check", () => {
    test("GET /health returns OK", async () => {
        const res = await request("http://localhost:3000").get("/health");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "OK" });
    });
});
