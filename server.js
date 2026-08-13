const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Rival Game Server işləyir!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Rival Game Server başladı!");
});
