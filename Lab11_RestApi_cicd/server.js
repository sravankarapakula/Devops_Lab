const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/status", (req, res) => {
    res.status(200).json({
        status: "API is running successfully"
    });
});

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
