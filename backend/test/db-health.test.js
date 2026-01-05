const request = require("supertest");

describe("Database health check", () => {
    test("GET /db-health returns DB connected", async () => {
        const res = await request("http://localhost:3000")
            .get("/db-health");

        expect(res.statusCode).toBe(200);
        expect(res.body.db).toBe("connected");
    });
});
