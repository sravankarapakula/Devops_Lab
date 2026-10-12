const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("./server");

test("GET /status returns HTTP 200 and the expected JSON", async () => {
    const server = app.listen(0, "127.0.0.1");

    try {
        await new Promise((resolve, reject) => {
            server.once("listening", resolve);
            server.once("error", reject);
        });

        const address = server.address();
        const response = await fetch(
            `http://127.0.0.1:${address.port}/status`
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            status: "API is running successfully"
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});
